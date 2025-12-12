import Notification from "../models/notificationModel.js";
import { getIO } from "../socket/socket.js";

export async function sendNotificationToUser({
  userId,
  title,
  message,
  eventId,
  type = "info",
}) {
  if (!userId || !title || !message || !eventId) return;

  const notification = await Notification.create({
    userId,
    title,
    message,
    eventId,
    type,
  });

  // emit via socket to that user's room
  try {
    const io = getIO();
    io.to(userId.toString()).emit("new-notification", notification);
  } catch (err) {
    console.log("Socket emit failed (notification still saved):", err.message);
  }

  return notification;
}
