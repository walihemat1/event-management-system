import Event from "../models/eventModel.js";
import { isUserEventOrganizer } from "../utils/eventOrganizer.js";
import User from "../models/userModel.js";

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
    !endTime ||
    !location.mode ||
    !categories ||
    !eventType
  )
    return res.status(400).json({
      success: false,
      message: "All fileds are required. Provide the missing fields",
      fieldsMissing: [
        organizerId && false,
        title && false,
        description && false,
        startTime && false,
        endTime && false,
        location.mode && false,
        categories && false,
        eventType && false,
      ].filter(Boolean),
    });

  try {
    const event = await Event.create({
      organizerId: req?.user._id,
      title,
      description,
      status,
      startTime: Date.now(startTime),
      endTime: Date.now(endTime),
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
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// get all events
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find();
    res.status(200).json({
      success: true,
      message: "All events",
      data: events,
    });
  } catch (error) {
    console.log("Error in getEvents controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// get a single event
export const getEvent = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId)
    return res.status(400).json({
      success: false,
      message: "Event Id is required",
    });

  try {
    const event = await Event.findById(eventId);

    if (!event)
      return res.status(404).json({
        success: false,
        message: "Event was not found",
      });

    res.status(200).json({
      success: true,
      message: "Event found",
      data: event,
    });
  } catch (error) {
    console.log("Error in getEvent controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// update an event
export const updateEvent = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId)
    return res.status(400).json({
      success: false,
      message: "Event ID is required",
    });

  try {
    const currentLoggedInUser = await User.findById(req.user._id);
    const event = await Event.findById(eventId);

    if (!event)
      return res.status(404).json({
        success: false,
        message: `No event found with ID ${eventId}`,
      });

    // check if the user is event creator/organizer
    await isUserEventOrganizer(event._id, currentLoggedInUser, res);

    // update event
    const updatedEvent = await Event.findByIdAndUpdate(eventId, req.body, {
      new: true,
    });

    if (!updatedEvent)
      return res.status(404).json({
        success: false,
        message: "Event was not found",
      });

    res.status(200).json({
      success: true,
      message: "Event was updated successfully",
      data: updatedEvent,
    });
  } catch (error) {
    console.log("Error in updateEvent controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

// delete an event
export const deleteEvent = async (req, res) => {
  const { eventId } = req.params;

  if (!eventId)
    return res.status(400).json({
      success: false,
      message: "Event ID is required",
    });

  try {
    const currentLoggedInUser = await User.findById(req.user._id);
    const event = await Event.findById(eventId);

    if (!event)
      return res.status(404).json({
        success: false,
        message: `No event found with ID ${eventId}`,
      });

    // check if the user is event creator/organizer
    await isUserEventOrganizer(event._id, currentLoggedInUser, res);

    // delete event
    const deletedEvent = await Event.findByIdAndDelete(eventId);

    if (!deletedEvent)
      return res.status(404).json({
        success: false,
        message: "Event was not found",
      });

    res.status(204).json({
      success: true,
      message: "Event was deleted successfully",
      data: deletedEvent,
    });
  } catch (error) {
    console.log("Error in deleteEvent controller: ", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
