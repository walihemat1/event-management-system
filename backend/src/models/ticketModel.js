// models/ticketModel.js
import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    quantityAvailable: {
      type: Number,
      required: true,
      min: 0,
    },
    quantitySold: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { timestamps: true }
);

// Ensure ticket name is unique per event (not globally)
ticketSchema.index({ eventId: 1, name: 1 }, { unique: true });

const Ticket = mongoose.model("Ticket", ticketSchema);
export default Ticket;
