import express from "express";

import { register, login, logout, me } from "../controllers/auth.controller.js";

import { authenticateUser } from "../middlewares/auth.middleware.js";
import {
  googleStart,
  googleCallback,
  googleLinkStart,
  googleLinkCallback,
  googleUnlink,
} from "../controllers/oauth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", authenticateUser, me);

// OAuth (Google)
router.get("/oauth/google/start", googleStart);
router.get("/oauth/google/callback", googleCallback);

// Linking UI (logged-in user links Google to existing account)
router.get("/oauth/google/link/start", authenticateUser, googleLinkStart);
router.get("/oauth/google/link/callback", authenticateUser, googleLinkCallback);
router.delete("/oauth/google/unlink", authenticateUser, googleUnlink);

export default router;
