import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  updatePassword,
  updateProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.patch("/password", authenticateUser, updatePassword);
router.patch("/profile", authenticateUser, updateProfile);

export default router;
