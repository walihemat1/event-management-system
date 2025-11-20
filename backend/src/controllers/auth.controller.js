import validator from "validator";
import { generateToken } from "../middlewares/token.middleware.js";
import User from "../models/userModel.js";

export const register = async (req, res) => {
  const { username, email, password } = req.body;

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

    const newUser = await User.create({ email, username, password });

    //generate token
    // generateToken(res, newUser._id);

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: {
        email: newUser.email,
        username: newUser.username,
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

    //generate token
    const token = generateToken(res, user._id);

    res.cookie("token", token, {
      maxAge: 24 * 7 * 60 * 60 * 1000,
      httpOnly: process.env.NODE_ENV === "production" ? true : false,
    });

    res.status(200).json({
      success: true,
      message: "Logged in successfully!",
      data: {
        email: user.email,
        username: user.username,
        id: user._id,
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
  res.cookie("token", "");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};
