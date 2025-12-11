// controllers/adminUser.controller.js
import User from "../models/userModel.js";

/**
 * GET /api/admin/users
 * Query: page, limit, search, role, status
 */
export const getUsersForAdmin = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const skip = (page - 1) * limit;

    const { search, role, status } = req.query;

    const query = {};

    if (search) {
      const regex = new RegExp(search, "i");
      query.$or = [{ email: regex }, { fullName: regex }, { username: regex }];
    }

    if (role && ["attendee", "organizer", "admin"].includes(role)) {
      query.role = role;
    }

    if (status === "active") query.isActive = true;
    if (status === "inactive") query.isActive = false;

    const [users, total] = await Promise.all([
      User.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select("-password"),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error in getUsersForAdmin:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * PATCH /api/admin/users/:userId/status
 * Body: { isActive: boolean }
 */
export const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { isActive } = req.body;

  if (typeof isActive !== "boolean") {
    return res.status(400).json({
      success: false,
      message: "isActive boolean is required",
    });
  }

  try {
    // prevent admin from changing their own activation status
    if (String(req.user._id) === String(userId)) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own activation status",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    user.isActive = isActive;
    if (!isActive) {
      user.deactivatedAt = new Date();
      user.deactivatedBy = req.user._id;
    } else {
      user.deactivatedAt = undefined;
      user.deactivatedBy = undefined;
    }

    await user.save();

    return res.status(200).json({
      success: true,
      message: `User has been ${isActive ? "activated" : "deactivated"}`,
      data: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
        deactivatedAt: user.deactivatedAt,
      },
    });
  } catch (error) {
    console.error("Error in updateUserStatus:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * 🆕 PATCH /api/admin/users/:userId/role
 * Body: { role: "admin" | "organizer" | "attendee" }
 */
export const updateUserRole = async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  const allowedRoles = ["attendee", "organizer", "admin"];

  if (!allowedRoles.includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Invalid role",
    });
  }

  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // prevent changing your own role away from admin
    if (String(req.user._id) === String(userId) && role !== "admin") {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role away from admin",
      });
    }

    // if demoting an admin, ensure at least one other admin remains
    if (user.role === "admin" && role !== "admin") {
      const otherAdminsCount = await User.countDocuments({
        _id: { $ne: userId },
        role: "admin",
        isActive: true,
      });

      if (otherAdminsCount === 0) {
        return res.status(400).json({
          success: false,
          message:
            "You cannot remove the last active admin. There must be at least one admin account.",
        });
      }
    }

    user.role = role;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "User role updated successfully",
      data: {
        _id: user._id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
        isActive: user.isActive,
      },
    });
  } catch (error) {
    console.error("Error in updateUserRole:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
