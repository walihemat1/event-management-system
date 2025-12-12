import Event from "../models/eventModel.js";
import { isUserEventOrganizer } from "../utils/eventOrganizer.js";
import { getTicketStatsForEvent } from "../utils/ticketStats.js";
import { getFeedbackStatsForEvent } from "../utils/feedbackStats.js";
import { sendNotificationToUser } from "../utils/notification.js";
import EventRegistraion from "../models/eventRegistrationModel.js";

// CREATE EVENT
export const createEvent = async (req, res) => {
  const {
    title,
    description,
    status,
    startTime,
    endTime,
    location,
    media,
    categories,
    eventType,
  } = req.body;

  if (
    !title ||
    !description ||
    !startTime ||
    !location?.mode ||
    !categories ||
    !eventType
  ) {
    return res.status(400).json({
      success: false,
      message: "All fields are required. Provide the missing fields",
    });
  }

  try {
    const event = await Event.create({
      organizerId: req?.user._id,
      title,
      description,
      status,
      startTime,
      endTime,
      location,
      media,
      categories,
      eventType,
    });

    res.status(201).json({
      success: true,
      message: "Event was created successfully",
      data: event,
    });
  } catch (error) {
    console.log("Error in createEvent controller: ", error);
    res.status(500).json({ success: false, error: "Internal server error" });
  }
};

// GET ALL EVENTS
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({}).populate("categories").lean();

    const eventsWithStats = await Promise.all(
      events.map(async (evt) => {
        const [ticketStats, feedbackStats] = await Promise.all([
          getTicketStatsForEvent(evt._id),
          getFeedbackStatsForEvent(evt._id),
        ]);

        return {
          ...evt,
          ticketStats,
          feedbackStats,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: eventsWithStats,
    });
  } catch (error) {
    console.log("Error in getEvents controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// GET SINGLE EVENT
export const getEvent = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId) {
    return res.status(400).json({
      success: false,
      message: "Event ID is required",
    });
  }

  try {
    const event = await Event.findById(eventId).populate({
      path: "categories",
      model: "Category",
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event was not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Event found",
      data: event,
    });
  } catch (error) {
    console.log("Error in getEvent controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// UPDATE EVENT
export const updateEvent = async (req, res) => {
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
        message: `No event found with ID ${eventId}`,
      });
    }

    const authorized = await isUserEventOrganizer(event._id, req.user);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - You are not the event organizer",
      });
    }

    const oldEvent = event.toObject();

    const updatedEvent = await Event.findByIdAndUpdate(eventId, req.body, {
      new: true,
    });

    // If status changed to cancelled
    if (
      oldEvent.status !== "cancelled" &&
      updatedEvent.status === "cancelled"
    ) {
      // find all active registrations
      const regs = await EventRegistraion.find({
        eventId: updatedEvent._id,
        status: { $ne: "cancelled" },
      });

      for (const reg of regs) {
        await sendNotificationToUser({
          userId: reg.userId,
          title: "Event cancelled",
          message: `The event "${updatedEvent.title}" has been cancelled.`,
          eventId: updatedEvent._id,
          type: "event",
        });
      }
    }

    // If date/time changed significantly
    if (
      oldEvent.startTime.getTime() !== updatedEvent.startTime.getTime() ||
      (oldEvent.endTime &&
        updatedEvent.endTime &&
        oldEvent.endTime.getTime() !== updatedEvent.endTime.getTime())
    ) {
      const regs = await EventRegistraion.find({
        eventId: updatedEvent._id,
        status: { $ne: "cancelled" },
      });

      for (const reg of regs) {
        await sendNotificationToUser({
          userId: reg.userId,
          title: "Event updated",
          message: `The schedule for "${updatedEvent.title}" has changed. Please review the new time.`,
          eventId: updatedEvent._id,
          type: "event",
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Event updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.log("Error in updateEvent controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// DELETE EVENT
export const deleteEvent = async (req, res) => {
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
        message: `No event found with ID ${eventId}`,
      });
    }

    const authorized = await isUserEventOrganizer(event._id, req.user);
    if (!authorized) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized - You are not the event organizer",
      });
    }

    await Event.findByIdAndDelete(eventId);

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.log("Error in deleteEvent controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// GET EVENTS OF CURRENT ORGANIZER
export const getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ organizerId: req.user._id })
      .populate("categories")
      .lean();

    const eventsWithStats = await Promise.all(
      events.map(async (evt) => {
        const [ticketStats, feedbackStats] = await Promise.all([
          getTicketStatsForEvent(evt._id),
          getFeedbackStatsForEvent(evt._id),
        ]);

        return {
          ...evt,
          ticketStats,
          feedbackStats,
        };
      })
    );

    res.status(200).json({
      success: true,
      data: eventsWithStats,
    });
  } catch (error) {
    console.log("Error in getMyEvents controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
