import express from "express";
import {
  createTicket,
  deleteTicket,
  getTicket,
  getTickets,
  updateTicket,
} from "../controllers/ticket.controller.js";
import { authenticateUser } from "../middlewares/auth.middleware.js";

const router = express.Router();

/*/api/events/:eventId/tickets*/
router.post("/tickets", authenticateUser, createTicket);
router.get("/:eventId/tickets", authenticateUser, getTickets);
router.get("/tickets/:ticketId", authenticateUser, getTicket);
router.patch("/:eventId/tickets/:ticketId", authenticateUser, updateTicket);
router.delete("/:eventId/tickets/:ticketId", authenticateUser, deleteTicket);

export default router;
