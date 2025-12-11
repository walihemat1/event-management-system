// src/utils/ticketStats.js
import mongoose from "mongoose";
import Ticket from "../models/ticketModel.js";

export async function getTicketStatsForEvent(eventId) {
  // Safety: convert to ObjectId
  const id =
    typeof eventId === "string"
      ? new mongoose.Types.ObjectId(eventId)
      : eventId;

  const tickets = await Ticket.find({ eventId: id }).lean();

  if (!tickets || tickets.length === 0) {
    return {
      totalTickets: 0,
      soldTickets: 0,
      remainingTickets: 0,
    };
  }

  const totalTickets = tickets.reduce(
    (sum, t) => sum + (t.quantityAvailable ?? 0),
    0
  );
  const soldTickets = tickets.reduce(
    (sum, t) => sum + (t.quantitySold ?? 0),
    0
  );
  const remainingTickets = Math.max(totalTickets - soldTickets, 0);

  return {
    totalTickets,
    soldTickets,
    remainingTickets,
  };
}
