import express from "express";
import {
  createEvent,
  deleteEvent,
  getEvent,
  getEvents,
  updateEvent,
  getMyEvents,
} from "../controllers/event.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/", authenticateUser, createEvent);
router.get("/", authenticateUser, getEvents);
router.get("/my-events", authenticateUser, getMyEvents);
router.get("/:eventId", authenticateUser, getEvent);
router.patch("/:eventId", authenticateUser, updateEvent);
router.delete("/:eventId", authenticateUser, deleteEvent);

export default router;
