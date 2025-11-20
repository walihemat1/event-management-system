import Notification from "../models/notificationModel.js";
import { getIO } from "../socket/socket.js";

export const createNotification = async (req, res) => {
  try {
    const { title, message, eventId } = req.body;

    if (!title || !message || !eventId)
      return res.status(400).json({
        success: false,
        message: "title, message, eventId are required",
      });

    const userId = req.user._id;
    const io = getIO();

    const notification = await Notification.create({
      userId,
      title,
      message,
      eventId,
    });

    io.to(userId.toString()).emit("new-notification", notification);

    res.status(201).json({
      success: true,
      message: "Notification created successfully",
      data: notification,
    });
  } catch (error) {
    console.log("Error in createNotification controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// Get user notifications
export const getUserNotifications = async (req, res) => {
  try {
    const userId = req.params.userId;
    if (!userId)
      return res.status(400).json({
        success: false,
        message: "User id required",
      });

    const notifications = await Notification.find({ userId }).sort({
      createdAt: -1,
    });

    res.status(200).json({
      success: true,
      message: "User all notifications",
      data: notifications,
    });
  } catch (error) {
    console.log("Error in getUserNotifications controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;

    if (!notificationId)
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });

    const notification = await Notification.findByIdAndUpdate(
      notificationId,
      { isRead: true },
      { new: true }
    );

    if (!notification)
      return res.status(404).json({
        success: false,
        message: "Notification was not found",
      });

    res.status(200).json({
      success: true,
      message: "Notification was marked as read",
      data: notification,
    });
  } catch (error) {
    console.log("Error in markAsRead controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteNotificaiton = async (req, res) => {
  try {
    const notificationId = req.params.notificationId;
    if (!notificationId)
      return res.status(400).json({
        success: false,
        message: "Notification ID is required",
      });

    const notification = await Notification.findByIdAndDelete(notificationId);
    if (!notification)
      return res.status(404).json({
        success: false,
        message: "Notification was not found",
      });

    res.status(200).json({
      success: true,
      message: "Notification was deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteNotification controller: ", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
