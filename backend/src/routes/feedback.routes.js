import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  addFeedback,
  deleteFeedback,
  getAllFeedbacks,
  getSingleFeedback,
  getSpecificEventAllFeedbacks,
  updateFeedback,
} from "../controllers/feedback.controller.js";

const router = express.Router();

router.get("/feedback", authenticateUser, getAllFeedbacks);
router.post("/feedback", authenticateUser, addFeedback);

router.get(
  "/:eventId/feedback",
  authenticateUser,
  getSpecificEventAllFeedbacks
);
router.get("/feedback/:feedbackId", authenticateUser, getSingleFeedback);
router.patch("/feedback/:feedbackId", authenticateUser, updateFeedback);
router.delete("/feedback/:feedbackId", authenticateUser, deleteFeedback);

export default router;
