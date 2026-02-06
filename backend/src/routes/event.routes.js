import express from "express";
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  updateEvent,
  getMyEvents,
  publishEvent,
} from "../controllers/event.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { uploadEventProfilePic } from "../middlewares/upload.middleware.js";
import {
  deleteEventProfilePictureFromCloudinary,
  uploadEventProfilePicture,
} from "../controllers/upload.controller.js";

const router = express.Router();

router.post("/", authenticateUser, createEvent);
router.get("/", authenticateUser, getEvents);
router.get("/my-events", authenticateUser, getMyEvents);
router.get("/:eventId", authenticateUser, getEvent);
router.patch("/:eventId", authenticateUser, updateEvent);
router.post("/:eventId/publish", authenticateUser, publishEvent);
router.post(
  "/upload-event-profile-pic",
  authenticateUser,
  uploadEventProfilePic,
  uploadEventProfilePicture
);
router.post(
  "/delete-event-banner-cloudinary",
  authenticateUser,
  deleteEventProfilePictureFromCloudinary
);
router.delete("/:eventId", authenticateUser, deleteEvent);

export default router;
