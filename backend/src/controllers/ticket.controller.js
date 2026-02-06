// controllers/ticket.controller.js
import Ticket from "../models/ticketModel.js";
import Event from "../models/eventModel.js";
import { isUserEventOrganizer } from "../utils/eventOrganizer.js";

// Helper: basic validation
const validateRequired = (fields) => {
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null || value === "") {
      return `Field "${key}" is required`;
    }
  }
  return null;
};

// POST /api/events/:eventId/tickets
export const createTicket = async (req, res) => {
  const { eventId } = req.params;
  const { name, description, price, quantityAvailable } = req.body;

  const missing = validateRequired({ eventId, name, quantityAvailable });
  if (missing) {
    return res.status(400).json({
      success: false,
      message: missing,
    });
  }

  try {
    // check if the user is event creator/organizer
    const isOrganizer = await isUserEventOrganizer(eventId, req.user);
    if (!isOrganizer) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to manage tickets for this event",
      });
    }

    // enforce uniqueness per event
    const existingTicket = await Ticket.findOne({ eventId, name });
    if (existingTicket) {
      return res.status(400).json({
        success: false,
        message: "A ticket with this name already exists for this event",
      });
    }

    const newTicket = await Ticket.create({
      eventId,
      name,
      description,
      price,
      quantityAvailable,
      quantitySold: 0,
    });

    if (!newTicket) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong creating the ticket",
      });
    }

    // const updateEvent = await Event.findByIdAndUpdate(
    //   eventId,
    //   {
    //     isPublished: true,
    //   },
    //   { new: true }
    // );

    // if (!updateEvent) {
    //   await Ticket.findByIdAndDelete(newTicket._id);
    //   return res.status(500).json({
    //     success: false,
    //     message: "Something went wrong publishing the event",
    //   });
    // }

    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: newTicket,
    });
  } catch (error) {
    console.log("Error in createTicket controller: ", error);

    // handle duplicate index error as a fallback
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "A ticket with this name already exists for this event",
      });
    }

    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// GET /api/events/:eventId/tickets
export const getTickets = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required",
    });
  }

  try {
    const tickets = await Ticket.find({ eventId }).sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.log("Error in getTickets controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// GET /api/events/:eventId/tickets/:ticketId
export const getTicket = async (req, res) => {
  const { ticketId, eventId } = req.params;

  if (!eventId || !ticketId) {
    return res.status(400).json({
      success: false,
      message: "Event ID and Ticket ID are required",
    });
  }

  try {
    const ticket = await Ticket.findOne({ _id: ticketId, eventId });

    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `No ticket found for ID ${ticketId} in this event`,
      });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.log("Error in getTicket controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// PATCH /api/events/:eventId/tickets/:ticketId
export const updateTicket = async (req, res) => {
  const { ticketId, eventId } = req.params;

  if (!ticketId || !eventId) {
    return res.status(400).json({
      success: false,
      message: "Ticket ID and Event ID are required",
    });
  }

  try {
    // check if the user is event creator/organizer
    const isOrganizer = await isUserEventOrganizer(eventId, req.user);
    if (!isOrganizer) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to update tickets for this event",
      });
    }

    const ticket = await Ticket.findOne({ _id: ticketId, eventId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `No ticket found for ID ${ticketId} in this event`,
      });
    }

    // Prevent negative values
    const updateData = { ...req.body };
    if (updateData.quantityAvailable < 0) updateData.quantityAvailable = 0;
    if (updateData.quantitySold < 0) updateData.quantitySold = 0;
    if (updateData.price < 0) updateData.price = 0;

    const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedTicket) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong updating the ticket",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket was updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    console.log("Error in updateTicket controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// DELETE /api/events/:eventId/tickets/:ticketId
export const deleteTicket = async (req, res) => {
  const { ticketId, eventId } = req.params;

  if (!ticketId || !eventId) {
    return res.status(400).json({
      success: false,
      message: "Ticket ID and Event ID are required",
    });
  }

  try {
    // check if the user is event creator/organizer
    const isOrganizer = await isUserEventOrganizer(eventId, req.user);
    if (!isOrganizer) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to delete tickets for this event",
      });
    }

    const ticket = await Ticket.findOne({ _id: ticketId, eventId });
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: `No ticket found for ID ${ticketId} in this event`,
      });
    }

    const deletedTicket = await Ticket.findByIdAndDelete(ticketId);

    if (!deletedTicket) {
      return res.status(500).json({
        success: false,
        message: "Something went wrong deleting the ticket",
      });
    }

    res.status(200).json({
      success: true,
      message: "Ticket was deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteTicket controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
