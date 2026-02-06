import { z } from "zod";

export const eventSchema = z
  .object({
    title: z.string().min(3, "Title is required"),
    description: z.string().min(3, "Description is required"),

    startTime: z.string().min(1, "Start date is required"),
    endTime: z.string().min(1, "End date is required"),

    eventType: z.enum(["free", "paid"]),
    mode: z.enum(["physical", "virtual"]),

    address: z.string().optional(),
    link: z.string().optional(),
    bannerUrl: z.string().optional(),

    category: z.string().min(1, "Select a category"),
  })
  .superRefine((data, ctx) => {
    const now = new Date();
    now.setSeconds(0, 0);

    const start = data.startTime ? new Date(data.startTime) : null;
    const end = data.endTime ? new Date(data.endTime) : null;

    if (!start || Number.isNaN(start.getTime())) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Start date is required",
      });
      return;
    }

    if (start < now) {
      ctx.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Start time cannot be in the past",
      });
    }

    if (end && !Number.isNaN(end.getTime()) && end < start) {
      ctx.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "End time cannot be before start time",
      });
    }
  });
