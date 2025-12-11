// models/feedbackModel.js
import mongoose from "mongoose";

const feedbackSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },

    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);
feedbackSchema.index({ eventId: 1, userId: 1 }, { unique: true });
const Feedback = mongoose.model("Feedback", feedbackSchema);
export default Feedback;
