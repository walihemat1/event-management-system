import mongoose from "mongoose";

const eventRegistrationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    ticketId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Ticket",
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      default: "free", // for now
    },
    // 🆕 logical status of the registration
    status: {
      type: String,
      enum: ["active", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true }
);

// prevent duplicate registration for same user + event (no double registering)
eventRegistrationSchema.index({ userId: 1, eventId: 1 }, { unique: true });

const EventRegistration = mongoose.model(
  "EventRegistration",
  eventRegistrationSchema
);

export default EventRegistration;
