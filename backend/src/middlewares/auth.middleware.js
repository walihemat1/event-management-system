import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
export const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer "))
      return res.status(401).json({
        success: false,
        message: "No token provided, authorization denied",
      });

    const token = authHeader.split(" ")[1];
    // const token = req.cookie?.token;
    if (!token)
      return res.status(400).json({
        success: false,
        message: "No token was found",
      });
    let decodedToken = false;
    try {
      decodedToken = jwt.verify(token, process.env.JWT_SECRET_KEY);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: "Token is not valid. Please Login again",
      });
    }

    if (!decodedToken)
      return res.status(400).json({
        success: false,
        message: "Token is not valid. Please Login again",
      });

    const user = await User.findById(decodedToken.userId);

    if (!user)
      return res.status(500).json({
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
