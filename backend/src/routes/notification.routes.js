import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotificaiton,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.post("/", authenticateUser, createNotification);
router.get("/:userId", authenticateUser, getUserNotifications);
router.patch("/:notificationId", authenticateUser, markAsRead);
router.delete("/:notificationId", authenticateUser, deleteNotificaiton);

export default router;
