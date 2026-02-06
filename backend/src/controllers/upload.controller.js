import cloudinary from "../config/cloudinary.js";
import User from "../models/userModel.js";
import { Readable } from "stream";

export const uploadProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user._id;
    console.log("Uploading for user:", userId);

    // Convert buffer to stream for Cloudinary
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "event-management/profile-pictures",
          public_id: `user_${userId}_${Date.now()}`,
          transformation: [
            { width: 500, height: 500, crop: "limit" }, // Max dimensions
            { quality: "auto", fetch_format: "auto" }, // Auto optimize
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      bufferStream.pipe(uploadStream);
    });

    // Delete old profile picture from Cloudinary (if exits)
    if (req.user.profilePic && req.user.profilePic.includes("cloudinary")) {
      try {
        const publicId = extractPublicId(
          req.user.profilePic,
          "profile-pictures"
        );
        await cloudinary.uploader.destroy(publicId);
      } catch (error) {
        console.warn("Failed to delete old image:", error);
      }
    }

    // Update user profile with new URL
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        profilePic: uploadResult.secure_url,
      },
      { new: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      data: {
        profilePic: uploadResult.secure_url,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.log("Upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload profile picture",
    });
  }
};

export const uploadEventProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const userId = req.user._id;

    // Convert buffer to stream for Cloudinary
    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    // Upload to Cloudinary
    const uploadResult = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "event-management/event-profile-pic",
          public_id: `user_${userId}_${Date.now()}`,
          transformation: [
            { width: 500, height: 500, crop: "limit" }, // Max dimensions
            { quality: "auto", fetch_format: "auto" }, // Auto optimize
          ],
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      bufferStream.pipe(uploadStream);
    });

    res.status(200).json({
      success: true,
      message: "Event profile picture uploaded successfully",
      data: {
        eventPic: uploadResult.secure_url,
      },
    });
  } catch (error) {
    console.log("Upload error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to upload profile picture",
    });
  }
};

export const deleteEventProfilePictureFromCloudinary = async (req, res) => {
  try {
    const { eventPicUrl } = req.body;

    if (!eventPicUrl)
      return res.status(400).json({
        success: false,
        message: "Event picture URL is required",
      });

    const publicId = extractPublicId(eventPicUrl, "event-profile-pic");
    if (!publicId)
      return res.status(400).json({
        success: false,
        message: "Invalid event picture URL",
      });

    await cloudinary.uploader.destroy(publicId);
    return res.status(200).json({
      success: true,
      message: "Event profile picture deleted successfully",
    });
  } catch (error) {
    console.log("Delete error:", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to delete event profile picture",
    });
  }
};

// Helper to extract Cloudinary public ID from URL
function extractPublicId(url, folderPath) {
  const parts = url.split("/");
  const filename = parts[parts.length - 1];
  const publicId = filename.split(".")[0];
  return `event-management/${folderPath}/${publicId}`;
}
