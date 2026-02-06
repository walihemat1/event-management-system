import validator from "validator";
import { generateToken } from "../middlewares/token.middleware.js";
import User from "../models/userModel.js";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

const getTokenCookieOptions = () => {
  const isProd = process.env.NODE_ENV === "production";
  return {
    maxAge: THIRTY_DAYS_MS,
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax", // "none" required for cross-origin cookies
  };
};

export const register = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });

  try {
    if (!validator.isEmail(email))
      return res.status(400).json({
        success: false,
        message: "Invalid email. Please provide a valid email",
      });

    if (password.length < 8)
      return res.status(400).json({
        success: false,
        message: "Password should not be less than 8 characters!",
      });

    const exitedUser = await User.findOne({ email });

    if (exitedUser)
      return res.status(400).json({
        success: false,
        message: "User already exits",
      });

    const newUser = await User.create({ email, password });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        email: newUser.email,
        id: newUser._id,
      },
    });
  } catch (error) {
    console.log("Error in register Controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password)
    return res.status(400).json({
      success: false,
      message: "Email and password are required",
    });

  try {
    const user = await User.findOne({ email });

    if (!user)
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

    const matchedPassword = await user.comparePasswords(password);
    if (!matchedPassword)
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Your account has been deactivated. Contact support or an admin.",
      });
    }

    //generate token
    const token = generateToken(res, user._id);

    res.cookie("token", token, getTokenCookieOptions());

    res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      data: {
        email: user.email,
        username: user.username,
        id: user._id,
        role: user.role,
        fullName: user.fullName,
        profilePic: user.profilePic,
      },
      token,
    });
  } catch (error) {
    console.log("Error in login controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const logout = async (req, res) => {
  // Clear cookie using same cookie attributes to ensure browser removes it.
  const isProd = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
  });
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const me = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.log("Error in me controller: ", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
