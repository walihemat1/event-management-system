import mongoose from "mongoose";

const ticketShema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    name: {
      type: String,
      required: true,
      unique: true,
    },
    description: String,
    price: Number,
    quantityAvailable: {
      type: Number,
      required: true,
    },
    quantitySold: {
      type: Number,
    },
  },
  { timestamps: true }
);

const Ticket = mongoose.model("Ticket", ticketShema);
export default Ticket;
