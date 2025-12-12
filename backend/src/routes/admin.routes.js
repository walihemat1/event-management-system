// routes/adminRoutes.js
import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { authorizeAdmin } from "../middlewares/admin.middleware.js";
import { getAdminDashboard } from "../controllers/admin.controller.js";

const router = express.Router();

router.get("/dashboard", authenticateUser, authorizeAdmin, getAdminDashboard);

export default router;
