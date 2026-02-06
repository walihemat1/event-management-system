import { discovery, ClientSecretPost } from "openid-client";

let googleConfigPromise = null;

export async function getGoogleOidcConfig() {
  if (googleConfigPromise) return googleConfigPromise;

  googleConfigPromise = (async () => {
    const redirectUri = process.env.GOOGLE_REDIRECT_URI;
    const linkRedirectUri = process.env.GOOGLE_LINK_REDIRECT_URI || redirectUri;

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new Error("Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    }
    if (!redirectUri) {
      throw new Error("Missing GOOGLE_REDIRECT_URI");
    }

    // openid-client v6 returns a Configuration instance from discovery()
    return await discovery(
      new URL("https://accounts.google.com"),
      clientId,
      {
        redirect_uris: [redirectUri, linkRedirectUri].filter(Boolean),
        response_types: ["code"],
      },
      ClientSecretPost(clientSecret)
    );
  })();

  return googleConfigPromise;
}
