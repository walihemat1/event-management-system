import Ticket from "../models/ticketModel.js";
import { isUserEventOrganizer } from "../utils/eventOrganizer.js";

export const createTicket = async (req, res) => {
  if (!req.body?.eventId || !req.body?.name || !req.body?.quantityAvailable)
    return res.status(400).json({
      success: false,
      message: "All fields are required",
    });

  const { eventId, name } = req.body;

  try {
    // check if the user is event creator/organizer
    await isUserEventOrganizer(eventId, req.user, res);

    const exitedTicket = await Ticket.findOne({ name });
    if (exitedTicket)
      return res.status(400).json({
        success: false,
        message: "Ticket with the same name already exits",
      });

    const newTicket = await Ticket.create(req.body);
    res.status(201).json({
      success: true,
      message: "Ticket created successfully",
      data: newTicket,
    });
  } catch (error) {
    console.log("Error in createTicket controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getTickets = async (req, res) => {
  const eventId = req.params.eventId;

  if (!eventId)
    return res.status(400).json({
      success: false,
      message: "Event ID is required",
    });

  try {
    const tickets = await Ticket.find({ eventId });

    res.status(200).json({
      success: true,
      data: tickets,
    });
  } catch (error) {
    console.log("Error in getTicket controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getTicket = async (req, res) => {
  if (!req.params?.ticketId)
    return res.status(400).json({
      success: false,
      message: "Event ID and Ticket ID are required",
    });

  const { ticketId } = req.params;

  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket)
      return res.status(404).json({
        success: false,
        message: `No ticket found for  ID ${ticketId}`,
      });

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.log("Error in getTicket controller: ", error);
    res.status(500).jsonI({
      success: false,
      error: "Internal server error",
    });
  }
};

export const updateTicket = async (req, res) => {
  if (!req.params?.ticketId || !req.params?.eventId)
    return res.status(400).json({
      success: false,
      message: " Ticket and Event IDs is required",
    });

  const { ticketId, eventId } = req.params;

  try {
    // check if the user is event creator/organizer
    await isUserEventOrganizer(eventId, req.user, res);

    const ticketExits = await Ticket.findById(ticketId);
    if (!ticketExits)
      return res.status(500).json({
        success: false,
        message: `No ticket was found for ID ${ticketId}`,
      });

    const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, req.body, {
      new: true,
    });

    if (!updateTicket)
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
      });

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

export const deleteTicket = async (req, res) => {
  if (!req.params?.ticketId || !req.params?.eventId)
    return res.status(400).json({
      success: false,
      message: " Ticket and Event IDs is required",
    });

  const { ticketId, eventId } = req.params;

  try {
    // check if the user is event creator/organizer
    await isUserEventOrganizer(eventId, req.user, res);

    const ticketExits = await Ticket.findById(ticketId);
    if (!ticketExits)
      return res.status(404).json({
        success: false,
        message: `No ticket found for ID ${ticketId}`,
      });

    const deleteTicket = await Ticket.findByIdAndDelete(ticketId);

    if (!deleteTicket)
      return res.status(500).json({
        success: false,
        message: "Something went wrong",
      });

    res.status(204).json({
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
