import User from "../models/userModel.js";

export const updatePassword = async (req, res) => {
  if (!req.body?.currentPassword || !req.body?.newPassword)
    return res.status(400).json({
      success: false,
      message: "Current and new passwords are required",
    });

  const { currentPassword, newPassword } = req.body;

  try {
    const userId = req.user._id;
    const currentLoggedInUser = await User.findById(userId);

    if (!currentLoggedInUser)
      return res.status(404).json({
        success: false,
        message: "User not found",
      });

    const matchedPassword = await currentLoggedInUser.comparePasswords(
      currentPassword
    );

    if (!matchedPassword)
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });

    currentLoggedInUser.password = newPassword;
    await currentLoggedInUser.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  } catch (error) {
    console.log("Error in updatePassword controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const updateProfile = async (req, res) => {
  if (!req.body?.username || !req.body?.email || !req.body?.profilePic)
    return res.status(401).json({
      success: false,
      message: "username, email, profile-picture are required",
    });

  try {
    const currentLoggedInUser = await User.findById(req.user._id);
    if (!currentLoggedInUser)
      return res.status(404).json({
        success: false,
        message: "User not found! Please login again",
      });

    // check if user is not admin and trying to update role
    if (currentLoggedInUser.role !== "admin" && req.body.role)
      return res.status(401).json({
        success: false,
        message: "Only admin can update the role",
      });

    const updatedUser = await User.findByIdAndUpdate(
      currentLoggedInUser._id,
      req.body,
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log("Error in updateProfile controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
