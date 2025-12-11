import mongoose from "mongoose";

const locationSchema = new mongoose.Schema(
  {
    mode: {
      type: String,
      enum: ["physical", "virtual"],
      required: true,
    },
    address: String,
    link: String,
  },
  { _id: false }
);

const mediaSchema = new mongoose.Schema(
  {
    bannerUrl: { type: String, default: "" },
    gallery: [{ type: String }],
    videos: [{ type: String }],
  },
  { _id: false }
);

// -------------------- DEFAULT FUNCTIONS --------------------
const getNow = () => new Date();

const getEndOfDay = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};
// ------------------------------------------------------------

const eventSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxLength: 200,
    },

    status: {
      type: String,
      enum: ["upcoming", "ongoing", "ended", "cancelled"],
      default: "upcoming",
    },

    description: {
      type: String,
      trim: true,
      required: true,
    },

    startTime: {
      type: Date,
      required: true,
      default: getNow, // start now
    },

    endTime: {
      type: Date,
      required: true,
      default: getEndOfDay, // end of the day
    },

    location: locationSchema,
    media: mediaSchema,

    categories: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },

    eventType: {
      type: String,
      enum: ["free", "paid"],
      required: true,
    },

    isCancelled: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Event = mongoose.model("Event", eventSchema);
export default Event;
