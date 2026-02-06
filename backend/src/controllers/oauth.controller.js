import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  randomPKCECodeVerifier,
  randomState,
} from "openid-client";
import { getGoogleOidcConfig } from "../utils/oidcClients.js";
import User from "../models/userModel.js";
import { generateToken } from "../middlewares/token.middleware.js";

const OAUTH_TMP_COOKIE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes
const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const getFrontendUrl = () =>
  process.env.FRONTEND_URL || "http://localhost:5173";

const getTokenCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    maxAge: THIRTY_DAYS_MS,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
  };
};

const getTmpCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    maxAge: OAUTH_TMP_COOKIE_MAX_AGE_MS,
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  };
};

function clearTmpCookies(res) {
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("oauth_state", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });
  res.clearCookie("oauth_code_verifier", {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
  });
}

function redirectWithError(res, { to, code, provider = "google" }) {
  const base = getFrontendUrl();
  const path = to.startsWith("/") ? to : `/${to}`;
  const url = new URL(`${base}${path}`);
  url.searchParams.set("oauth", code);
  url.searchParams.set("provider", provider);
  return res.redirect(url.toString());
}

function getCurrentUrl(req) {
  // Build an absolute URL for openid-client to parse the authorization response
  const proto =
    req.headers["x-forwarded-proto"]?.toString() || req.protocol || "http";
  const host = req.headers["x-forwarded-host"] || req.get("host");
  return new URL(`${proto}://${host}${req.originalUrl}`);
}

function deriveUsername(email) {
  if (!email || typeof email !== "string") return "";
  return email.split("@")[0] || "";
}

function providerIdentity(provider, claims) {
  return {
    provider,
    providerUserId: claims.sub,
    email: claims.email,
    emailVerified: !!claims.email_verified,
    linkedAt: new Date(),
  };
}

async function findUserByProvider(provider, providerUserId) {
  return User.findOne({
    authProviders: {
      $elemMatch: { provider, providerUserId },
    },
  });
}

async function ensureUserActive(user) {
  if (!user?.isActive) {
    const err = new Error(
      "Your account has been deactivated. Contact support or an admin."
    );
    err.statusCode = 403;
    throw err;
  }
}

export const googleStart = async (req, res) => {
  try {
    const config = await getGoogleOidcConfig();

    const state = randomState();
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

    res.cookie("oauth_state", state, getTmpCookieOptions());
    res.cookie("oauth_code_verifier", codeVerifier, getTmpCookieOptions());

    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const url = buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: "openid email profile",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "select_account",
    });

    return res.redirect(url.toString());
  } catch (error) {
    console.log("Error in googleStart: ", error);
    return res.status(500).json({
      success: false,
      error: "Failed to start Google authentication",
    });
  }
};

export const googleCallback = async (req, res) => {
  try {
    const config = await getGoogleOidcConfig();

    const redirectUri = process.env.GOOGLE_REDIRECT_URI;

    // If the user cancels at Google, Google redirects back with error parameters.
    // Don't show raw JSON; send them back to the login UI gracefully.
    if (req.query?.error) {
      clearTmpCookies(res);
      return redirectWithError(res, { to: "/login", code: "cancelled" });
    }

    const state = req.cookies?.oauth_state;
    const codeVerifier = req.cookies?.oauth_code_verifier;

    if (!state || !codeVerifier) {
      clearTmpCookies(res);
      return redirectWithError(res, { to: "/login", code: "expired" });
    }

    const tokenSet = await authorizationCodeGrant(
      config,
      getCurrentUrl(req),
      {
        expectedState: state,
        pkceCodeVerifier: codeVerifier,
        idTokenExpected: true,
      },
      {
        redirect_uri: redirectUri,
      }
    );

    // Clear temp cookies early
    clearTmpCookies(res);

    const claims = tokenSet.claims();

    if (!claims?.sub) {
      return res.status(400).json({
        success: false,
        message: "Google did not return a valid user id (sub).",
      });
    }

    if (!claims?.email) {
      return res.status(400).json({
        success: false,
        message: "Google did not return an email address.",
      });
    }

    if (!claims.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Your Google email is not verified.",
      });
    }

    const provider = "google";

    let user = await findUserByProvider(provider, claims.sub);

    if (user) {
      await ensureUserActive(user);
    } else {
      // If email matches an existing local account, auto-link (verified email policy).
      const existingByEmail = await User.findOne({ email: claims.email });

      if (existingByEmail) {
        await ensureUserActive(existingByEmail);

        // Link if not already linked
        const alreadyLinked = (existingByEmail.authProviders || []).some(
          (p) => p.provider === provider && p.providerUserId === claims.sub
        );
        if (!alreadyLinked) {
          existingByEmail.authProviders = existingByEmail.authProviders || [];
          existingByEmail.authProviders.push(
            providerIdentity(provider, claims)
          );

          // Set profile defaults only if empty (avoid overwriting user edits)
          if (!existingByEmail.fullName && claims.name) {
            existingByEmail.fullName = claims.name;
          }
          if (!existingByEmail.profilePic && claims.picture) {
            existingByEmail.profilePic = claims.picture;
          }
          if (!existingByEmail.username) {
            existingByEmail.username = deriveUsername(existingByEmail.email);
          }

          await existingByEmail.save();
        }

        user = existingByEmail;
      } else {
        // Create OAuth-only account
        user = await User.create({
          email: claims.email,
          password: undefined,
          fullName: claims.name || "",
          username: deriveUsername(claims.email),
          profilePic: claims.picture || "",
          authProviders: [providerIdentity(provider, claims)],
        });
      }
    }

    // Issue our app session cookie
    const token = generateToken(res, user._id);
    res.cookie("token", token, getTokenCookieOptions());

    // Redirect back to frontend
    return res.redirect(`${getFrontendUrl()}/auth/callback?provider=google`);
  } catch (error) {
    console.log("Error in googleCallback: ", error);
    clearTmpCookies(res);
    const status = error.statusCode || 500;

    // If something goes wrong, keep UX consistent by redirecting back to login.
    // Status is useful for logs, but users should see a friendly UI message.
    if (status >= 400 && status < 500) {
      return redirectWithError(res, { to: "/login", code: "failed" });
    }

    return res.status(status).json({
      success: false,
      message: error.message || "Google authentication failed",
    });
  }
};

export const googleLinkStart = async (req, res) => {
  try {
    const config = await getGoogleOidcConfig();

    const state = randomState();
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

    res.cookie("oauth_state", state, getTmpCookieOptions());
    res.cookie("oauth_code_verifier", codeVerifier, getTmpCookieOptions());

    const linkRedirectUri =
      process.env.GOOGLE_LINK_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;

    const url = buildAuthorizationUrl(config, {
      redirect_uri: linkRedirectUri,
      scope: "openid email profile",
      state,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
      prompt: "consent",
    });

    return res.redirect(url.toString());
  } catch (error) {
    console.log("Error in googleLinkStart: ", error);
    return res.status(500).json({
      success: false,
      error: "Failed to start Google linking",
    });
  }
};

export const googleLinkCallback = async (req, res) => {
  try {
    const config = await getGoogleOidcConfig();
    const linkRedirectUri =
      process.env.GOOGLE_LINK_REDIRECT_URI || process.env.GOOGLE_REDIRECT_URI;

    if (req.query?.error) {
      clearTmpCookies(res);
      return redirectWithError(res, { to: "/profile", code: "cancelled" });
    }

    const state = req.cookies?.oauth_state;
    const codeVerifier = req.cookies?.oauth_code_verifier;

    if (!state || !codeVerifier) {
      clearTmpCookies(res);
      return redirectWithError(res, { to: "/profile", code: "expired" });
    }

    const tokenSet = await authorizationCodeGrant(
      config,
      getCurrentUrl(req),
      {
        expectedState: state,
        pkceCodeVerifier: codeVerifier,
        idTokenExpected: true,
      },
      {
        redirect_uri: linkRedirectUri,
      }
    );

    clearTmpCookies(res);

    const claims = tokenSet.claims();

    if (!claims?.sub || !claims?.email) {
      return res.status(400).json({
        success: false,
        message: "Google did not return required identity claims.",
      });
    }

    if (!claims.email_verified) {
      return res.status(403).json({
        success: false,
        message: "Your Google email is not verified.",
      });
    }

    const provider = "google";
    const currentUser = req.user;

    // Prevent linking a Google identity already linked to a different account
    const existing = await findUserByProvider(provider, claims.sub);
    if (existing && existing._id.toString() !== currentUser._id.toString()) {
      return res.status(409).json({
        success: false,
        message: "That Google account is already linked to another user.",
      });
    }

    const fullUser = await User.findById(currentUser._id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await ensureUserActive(fullUser);

    const alreadyLinked = (fullUser.authProviders || []).some(
      (p) => p.provider === provider && p.providerUserId === claims.sub
    );

    if (!alreadyLinked) {
      fullUser.authProviders = fullUser.authProviders || [];
      fullUser.authProviders.push(providerIdentity(provider, claims));
      await fullUser.save();
    }

    return res.redirect(`${getFrontendUrl()}/profile?linked=google`);
  } catch (error) {
    console.log("Error in googleLinkCallback: ", error);
    clearTmpCookies(res);
    return redirectWithError(res, { to: "/profile", code: "failed" });
  }
};

export const googleUnlink = async (req, res) => {
  try {
    const fullUser = await User.findById(req.user._id);
    if (!fullUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    await ensureUserActive(fullUser);

    const providers = fullUser.authProviders || [];
    const remainingProviders = providers.filter((p) => p.provider !== "google");

    const hasPassword = !!fullUser.password;
    const wouldHaveNoLoginMethod =
      !hasPassword && remainingProviders.length === 0;

    if (wouldHaveNoLoginMethod) {
      return res.status(400).json({
        success: false,
        message:
          "You can't unlink Google because it is your only sign-in method. Add a password first.",
      });
    }

    fullUser.authProviders = remainingProviders;
    await fullUser.save();

    return res.status(200).json({
      success: true,
      message: "Google account unlinked successfully",
    });
  } catch (error) {
    console.log("Error in googleUnlink: ", error);
    return res.status(500).json({
      success: false,
      error: "Failed to unlink Google account",
    });
  }
};
