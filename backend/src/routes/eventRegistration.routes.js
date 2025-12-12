import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  createEventRegistration,
  getEventRegistrations,
  getUserEventRegistrations,
  cancelEventRegistration,
} from "../controllers/eventRegistration.controller.js";

const router = express.Router();

// Create registration
router.post("/eventRegistrations", authenticateUser, createEventRegistration);

// Current user registrations
router.get(
  "/eventRegistrations/me",
  authenticateUser,
  getUserEventRegistrations
);

// All registrations for a specific event (organizer/admin)
router.get(
  "/event/:eventId/eventRegistrations",
  authenticateUser,
  getEventRegistrations
);

// Cancel a specific registration
router.patch(
  "/eventRegistrations/:registrationId/cancel",
  authenticateUser,
  cancelEventRegistration
);

export default router;
