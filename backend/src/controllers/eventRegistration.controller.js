import EventRegistration from "../models/eventRegistrationModel.js";
import Ticket from "../models/ticketModel.js";
import User from "../models/userModel.js";
import Event from "../models/eventModel.js";
import { isUserEventOrganizer } from "../utils/eventOrganizer.js";
import { sendNotificationToUser } from "../utils/notification.js";

export const createEventRegistration = async (req, res) => {
  try {
    const {
      eventId,
      ticketId,
      quantity,
      totalAmount,
      paymentMethod,
      paymentStatus,
    } = req.body;

    if (!eventId || !ticketId || !quantity || totalAmount == null) {
      return res.status(400).json({
        success: false,
        message: "eventId, ticketId, quantity and totalAmount are required",
      });
    }

    if (quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: "Quantity must be at least 1",
      });
    }

    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "User not found - please log in",
      });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event was not found",
      });
    }

    // prevent registration AFTER event end
    if (event.endTime && new Date(event.endTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "This event has already ended.",
      });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket was not found",
      });
    }

    // 🔎 Check if there is any existing registration for this user+event
    const existingReg = await EventRegistration.findOne({
      userId: currentUser._id,
      eventId,
    });

    // 1) If there is an ACTIVE registration => block
    if (existingReg && existingReg.status === "active") {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
    }

    // calculate expected price
    const expectedTotal = (ticket.price ?? 0) * quantity;
    if (totalAmount < expectedTotal) {
      return res.status(400).json({
        success: false,
        message: "Total amount is less than expected ticket price",
      });
    }

    // Check ticket availability
    if ((ticket.quantityAvailable ?? 0) < quantity) {
      return res.status(400).json({
        success: false,
        message: "Not enough tickets left",
      });
    }

    // Update ticket stock (we always subtract, since cancellation already added back)
    const updatedTicket = await Ticket.findByIdAndUpdate(
      ticketId,
      {
        $inc: {
          quantityAvailable: -quantity,
          quantitySold: quantity,
        },
      },
      { new: true }
    );

    if (!updatedTicket) {
      return res.status(500).json({
        success: false,
        message: "Failed to update ticket stock",
      });
    }

    const finalPaymentStatus =
      paymentStatus || (expectedTotal === 0 ? "paid" : "pending");
    const finalPaymentMethod =
      paymentMethod || (expectedTotal === 0 ? "free" : "manual");

    let registration;

    // 2) If there is a CANCELLED registration ⇒ "reactivate" it
    if (existingReg && existingReg.status === "cancelled") {
      existingReg.ticketId = ticketId;
      existingReg.quantity = quantity;
      existingReg.totalAmount = totalAmount;
      existingReg.paymentStatus = finalPaymentStatus;
      existingReg.paymentMethod = finalPaymentMethod;
      existingReg.status = "active";

      registration = await existingReg.save();
    } else {
      // 3) No previous registration ⇒ create a new one
      registration = await EventRegistration.create({
        eventId,
        ticketId,
        quantity,
        totalAmount,
        paymentStatus: finalPaymentStatus,
        paymentMethod: finalPaymentMethod,
        userId: currentUser._id,
        status: "active",
      });
    }

    // 1) notify attendee
    await sendNotificationToUser({
      userId: currentUser._id,
      title: "Registration confirmed",
      message: `You registered for "${event.title}" (${ticket.name}) – Qty: ${quantity}.`,
      eventId: event._id,
      type: "event",
    });

    // 2) notify organizer
    if (event.organizerId) {
      await sendNotificationToUser({
        userId: event.organizerId,
        title: "New registration",
        message: `${currentUser.email} registered for "${event.title}".`,
        eventId: event._id,
        type: "event",
      });
    }

    return res.status(201).json({
      success: true,
      message: "Event registration created successfully",
      data: registration,
    });
  } catch (error) {
    console.log("Error in createEventRegistration:", error);

    // In case the unique index still triggers
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You are already registered for this event",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// GET ALL REGISTRATIONS FOR A SPECIFIC EVENT (organizer/admin)
// export const getEventRegistrations = async (req, res) => {
//   const { eventId } = req.params;

//   if (!eventId) {
//     return res.status(400).json({
//       success: false,
//       message: "Event ID is required",
//     });
//   }

//   try {
//     const registrations = await EventRegistration.find({ eventId })
//       .populate("userId", "fullName email")
//       .populate("ticketId", "name price");

//     res.status(200).json({
//       success: true,
//       message: "Event registrations fetched successfully",
//       data: registrations || [],
//     });
//   } catch (error) {
//     console.log("Error in getEventRegistrations controller:", error);
//     res.status(500).json({
//       success: false,
//       error: "Internal server error",
//     });
//   }
// };

export const getEventRegistrations = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required",
    });
  }

  try {
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Ensure current user is the organizer of this event
    const authorized = await isUserEventOrganizer(eventId, req.user);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - you are not the organizer of this event",
      });
    }

    // Fetch registrations with populated user + ticket
    const registrations = await EventRegistration.find({ eventId })
      .populate("userId", "fullName email")
      .populate("ticketId", "name price")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Event registrations",
      data: registrations,
    });
  } catch (error) {
    console.log("Error in getEventRegistrations controller: ", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// GET ALL REGISTRATIONS FOR CURRENT USER
export const getUserEventRegistrations = async (req, res) => {
  try {
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(401).json({
        success: false,
        message: "User not found - please log in",
      });
    }

    const registrations = await EventRegistration.find({
      userId: currentUser._id,
    })
      .populate("eventId", "title startTime endTime status location")
      .populate("ticketId", "name price");

    res.status(200).json({
      success: true,
      message: "User event registrations fetched successfully",
      data: registrations || [],
    });
  } catch (error) {
    console.log("Error in getUserEventRegistrations controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// CANCEL REGISTRATION (user cancels their own)
export const cancelEventRegistration = async (req, res) => {
  const { registrationId } = req.params;

  if (!registrationId) {
    return res.status(400).json({
      success: false,
      message: "Registration ID is required",
    });
  }

  try {
    const registration = await EventRegistration.findById(registrationId);
    if (!registration) {
      return res.status(404).json({
        success: false,
        message: "Registration not found",
      });
    }

    // Only the owner can cancel (or you can extend to admin)
    if (registration.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "You are not allowed to cancel this registration",
      });
    }

    if (registration.status === "cancelled") {
      return res.status(400).json({
        success: false,
        message: "Registration is already cancelled",
      });
    }

    const event = await Event.findById(registration.eventId);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // optional: prevent cancelling after event ended
    if (event.endTime && new Date(event.endTime) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "You cannot cancel a registration for a past event.",
      });
    }

    const ticket = await Ticket.findById(registration.ticketId);
    if (!ticket) {
      return res.status(404).json({
        success: false,
        message: "Ticket not found",
      });
    }

    const qty = registration.quantity;

    // Put tickets back
    await Ticket.findByIdAndUpdate(ticket._id, {
      $inc: {
        quantityAvailable: qty,
        quantitySold: -qty,
      },
    });

    registration.status = "cancelled";
    await registration.save();

    await sendNotificationToUser({
      userId: req.user._id,
      title: "Registration cancelled",
      message: `Your registration for "${event.title}" has been cancelled.`,
      eventId: event._id,
      type: "info",
    });

    if (event.organizerId) {
      await sendNotificationToUser({
        userId: event.organizerId,
        title: "Registration cancelled",
        message: `${req.user.email} cancelled their registration for "${event.title}".`,
        eventId: event._id,
        type: "info",
      });
    }

    res.status(200).json({
      success: true,
      message: "Registration cancelled successfully",
      data: registration,
    });
  } catch (error) {
    console.log("Error in cancelEventRegistration controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
