import express from "express";

import { register, login, logout } from "../controllers/auth.controller.js";

import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

export default router;
