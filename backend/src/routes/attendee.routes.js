// routes/meRoutes.js
import express from "express";
import { authenticateUser } from "../middlewares/auth.middleware.js";
import { getMyDashboard } from "../controllers/attendee.controller.js";

const router = express.Router();

router.get("/dashboard", authenticateUser, getMyDashboard);

export default router;
