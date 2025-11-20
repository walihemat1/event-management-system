import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Event",
    requiree: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
  },
  comment: String,
});

const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
