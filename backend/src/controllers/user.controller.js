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
  try {
    const currentLoggedInUser = await User.findById(req.user._id);

    if (!currentLoggedInUser) {
      return res.status(404).json({
        success: false,
        message: "User not found! Please login again",
      });
    }

    const updates = { ...req.body };

    // If not admin, prevent role change
    if (currentLoggedInUser.role !== "admin" && "role" in updates) {
      delete updates.role;
    }

    // Optional: basic sanity check so they don't clear email
    if (updates.email === "") {
      return res.status(400).json({
        success: false,
        message: "Email cannot be empty",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      currentLoggedInUser._id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    return res.status(200).json({
      success: true,
      message: "User profile updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log("Error in updateProfile controller: ", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getCurrentUser = async (req, res) => {
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
    console.log("Error in getCurrentUser controller: ", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
