import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  createEventRegistration,
  getEventRegistrations,
  getUserEventRegistrations,
} from "../controllers/eventRegistration.controller.js";

const router = express.Router();

router.post("/eventRegistrations", authenticateUser, createEventRegistration);

router.get(
  "/eventRegistrations/me",
  authenticateUser,
  getUserEventRegistrations
);

router.get(
  "/event/:eventId/eventRegistrations",
  authenticateUser,
  getEventRegistrations
);

export default router;
