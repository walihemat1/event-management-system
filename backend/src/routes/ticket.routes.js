// routes/ticket.routes.js
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

// All routes here are relative to /api/events

// Create a ticket for an event
// POST /api/events/:eventId/tickets
router.post("/:eventId/tickets", authenticateUser, createTicket);

// Get all tickets for an event
// GET /api/events/:eventId/tickets
router.get("/:eventId/tickets", authenticateUser, getTickets);

// Get a single ticket for an event
// GET /api/events/:eventId/tickets/:ticketId
router.get("/:eventId/tickets/:ticketId", authenticateUser, getTicket);

// Update a ticket for an event
// PATCH /api/events/:eventId/tickets/:ticketId
router.patch("/:eventId/tickets/:ticketId", authenticateUser, updateTicket);

// Delete a ticket for an event
// DELETE /api/events/:eventId/tickets/:ticketId
router.delete("/:eventId/tickets/:ticketId", authenticateUser, deleteTicket);

export default router;
