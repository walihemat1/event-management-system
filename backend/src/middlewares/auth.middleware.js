import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
export const authenticateUser = async (req, res, next) => {
  try {
    // Support both cookie-based sessions and Bearer tokens.
    // Cookie is preferred (httpOnly), Bearer header is supported for flexibility.
    const cookieToken = req.cookies?.token;
    const authHeader = req.headers?.authorization || req.headers?.Authorization;

    let headerToken = null;
    if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
      headerToken = authHeader.split(" ")[1];
    }

    const token = cookieToken || headerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token was found",
      });
    }
    let decodedToken = false;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: "Token is not valid. Please Login again",
      });
    }

    if (!decodedToken)
      return res.status(401).json({
        success: false,
        message: "Token is not valid. Please Login again",
      });

    const user = await User.findById(decodedToken.userId);

    if (!user)
      return res.status(401).json({
        success: false,
        message: "User was not found",
      });

    req.user = user;
    next();
  } catch (error) {
    console.log("Error in authenticateUser: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
