import EventRegistraion from "../models/eventRegistrationModel.js";
import Ticket from "../models/ticketModel.js";
import User from "../models/userModel.js";
import Event from "../models/eventModel.js";

export const createEventRegistration = async (req, res) => {
  // if (
  //   !req.body.eventId ||
  //   !req.body.ticketId ||
  //   !req.body.quantity ||
  //   !req.body.totalAmount
  // )
  //   return res.status(401).json({
  //     success: false,
  //     message: "All fields are required",
  //     missingFields: [
  //       req.body?.eventId && "eventId",
  //       req.body?.ticketId && "ticketId",
  //       req.body?.quantity && 0,
  //       req.body?.totalAmount && 0,
  //     ].filter(Boolean),
  //   });

  const {
    eventId,
    ticketId,
    quantity,
    totalAmount,
    paymentMethod,
    paymentStatus,
  } = req.body;

  try {
    const currentLoggedinUser = await User.findById(req.user._id);
    if (!currentLoggedinUser)
      return res.status(400).json({
        success: false,
        message: "User not found - Please login",
      });

    // check if event exits
    const event = await Event.findById(eventId);
    if (!event)
      return res.status(404).json({
        success: false,
        message: "Event was not found",
      });

    // check if ticket exits
    const ticket = await Ticket.findById(ticketId);
    if (!ticketId)
      return res.status(404).json({
        success: false,
        message: "Ticket was not found",
      });

    // check if user is not already registered for the same event
    const exitedEventRegistraions = await EventRegistraion.findOne({
      userId: currentLoggedinUser._id,
      eventId,
    });

    if (exitedEventRegistraions)
      return res.status(401).json({
        success: false,
        message: "User was already registered for this event",
      });

    if (ticket.quantityAvailable < quantity)
      return res.status(401).json({
        success: false,
        message: "Ticket qauntity is not enough left",
      });

    // update the ticket to subtract the number of quality of tickets
    const updatedTicket = await Ticket.findByIdAndUpdate(ticketId, {
      quantityAvailable: ticket.quantityAvailable - quantity,
      quantitySold: quantity,
    });

    if (!updatedTicket)
      return res.status(500).json({
        success: false,
        message: "Soemthing went wrong!",
      });

    const eventRegistraion = await EventRegistraion.create({
      eventId,
      ticketId,
      quantity,
      totalAmount,
      paymentStatus,
      paymentMethod,
      userId: currentLoggedinUser._id,
    });

    res.status(201).json({
      success: true,
      message: "Event registration was created successfully",
      data: eventRegistraion,
    });
  } catch (error) {
    console.log("Error in createEventRegistration: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getEventRegistrations = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId)
    return res.status(401).json({
      success: false,
      message: "Event ID is required",
    });

  try {
    const eventRegistraions = await EventRegistraion.find(eventId);

    if (!eventRegistraions)
      return res.status(404).json({
        success: false,
        message: "No registraions found",
      });

    res.status(200).json({
      success: true,
      message: "All registraions",
      data: eventRegistraions,
    });
  } catch (error) {
    console.log("Error in getEventRegistraions controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

export const getUserEventRegistrations = async (req, res) => {
  try {
    const currentLoggedinUser = await User.findById(req.user._id);
    if (!currentLoggedinUser)
      return res.status(400).json({
        success: false,
        message: "User not found - Please login",
      });

    const userEventRegistrations = await EventRegistraion.find({
      userId: currentLoggedinUser._id,
    });

    if (!userEventRegistrations)
      return res.status(404).json({
        success: false,
        message: "No registrations found",
      });

    res.status(200).json({
      success: true,
      message: "User all registraions",
      data: userEventRegistrations,
    });
  } catch (error) {
    console.log("Error in getUserEventRegistraions controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
