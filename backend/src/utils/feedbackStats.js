import mongoose from "mongoose";
import Feedback from "../models/feedbackModel.js";

export async function getFeedbackStatsForEvent(eventId) {
  if (!eventId) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const objId =
    typeof eventId === "string"
      ? new mongoose.Types.ObjectId(eventId)
      : eventId;

  const result = await Feedback.aggregate([
    { $match: { eventId: objId } },
    {
      $group: {
        _id: "$eventId",
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (!result.length) {
    return { averageRating: 0, totalReviews: 0 };
  }

  const { averageRating, totalReviews } = result[0];
  return { averageRating, totalReviews };
}
