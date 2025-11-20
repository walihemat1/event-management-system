import User from "../models/userModel.js";

export const checkUserRole = async (res, userRole, userId) => {
  try {
    const currentLoggedInUser = await User.findById(userId);
    if (currentLoggedInUser.role !== userRole)
      return res.status(402).json({
        success: false,
        message: `Unauthorized - user is not ${userRole}`,
      });
  } catch (error) {
    console.log("Error in checkUserRole util: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
