// routes/adminUser.routes.js
import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { authorizeAdmin } from "../middlewares/admin.middleware.js";
import {
  getUsersForAdmin,
  updateUserStatus,
  updateUserRole,
} from "../controllers/adminUser.controller.js";

const router = express.Router();

router.use(authenticateUser, authorizeAdmin);

router.get("/", getUsersForAdmin);
router.patch("/:userId/status", updateUserStatus);
router.patch("/:userId/role", updateUserRole);

export default router;
