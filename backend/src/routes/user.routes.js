// routes/userRoutes.js
import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  updatePassword,
  updateProfile,
  getCurrentUser,
} from "../controllers/user.controller.js";

const router = express.Router();

router.get("/me", authenticateUser, getCurrentUser);
router.patch("/password", authenticateUser, updatePassword);
router.patch("/profile", authenticateUser, updateProfile);

export default router;
