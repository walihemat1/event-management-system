// src/components/event/EventForm.jsx
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

import { Calendar, CheckCircle2 } from "lucide-react";

import { createEvent } from "./eventsSlice";
import { getCategories } from "../category/categorySlice";

// ✔ ZOD SCHEMA (simple, no endTime enforcement)
const eventSchema = z.object({
  title: z.string().min(3, "Title is required"),
  description: z.string().min(10, "Description is required"),

  startTime: z.string().min(1, "Start date is required"),
  endTime: z.string().optional(),

  eventType: z.enum(["free", "paid"]),
  mode: z.enum(["physical", "virtual"]),

  address: z.string().optional(),
  link: z.string().optional(),

  category: z.string().min(1, "Select a category"),
});

export default function EventForm() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { list: categories } = useSelector((state) => state.category);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  // refs for datetime inputs so icon can open the picker
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);

  const form = useForm({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: "",
      endTime: "",
      eventType: "free",
      mode: "physical",
      address: "",
      link: "",
      category: "",
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    reset,
  } = form;

  const mode = watch("mode");
  const eventType = watch("eventType");
  const categoryValue = watch("category");

  // load categories
  useEffect(() => {
    if (categories.length === 0) {
      dispatch(getCategories());
    }
  }, [dispatch, categories.length]);

  const onSubmit = async (values) => {
    const payload = {
      organizerId: user?._id || user?.id,
      title: values.title,
      description: values.description,
      startTime: values.startTime,
      endTime: values.endTime || null,
      eventType: values.eventType,
      categories: values.category,
      location: {
        mode: values.mode,
        address: values.mode === "physical" ? values.address : "",
        link: values.mode === "virtual" ? values.link : "",
      },
      media: {
        bannerUrl: "",
        gallery: [],
        videos: [],
      },
    };

    try {
      const resultAction = await dispatch(createEvent(payload));

      if (createEvent.fulfilled.match(resultAction)) {
        reset();
        setShowSuccessDialog(true);
      } else {
        console.error("Event creation failed:", resultAction.payload);
      }
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/events");
  };

  const handleSuccessOk = () => {
    setShowSuccessDialog(false);
    navigate("/organizer-events");
  };

  // helper to open native picker from the custom icon
  const openPicker = (ref) => {
    if (!ref?.current) return;
    if (typeof ref.current.showPicker === "function") {
      ref.current.showPicker();
    } else {
      ref.current.focus();
    }
  };

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-3xl mx-auto p-6 md:p-8 rounded-xl border bg-card shadow-sm space-y-6"
      >
        {/* Header row with title + back button */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Create Event
            </h2>
            <p className="text-sm text-muted-foreground">
              Set up the basics of your event: details, schedule, and location.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="shrink-0"
          >
            Go back
          </Button>
        </div>

        {/* Title */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="title">Event Title</Label>
          <Input
            id="title"
            {...register("title")}
            placeholder="Enter event title"
          />
          <p className="text-xs text-destructive min-h-[1rem]">
            {errors.title?.message}
          </p>
        </div>

        {/* Description */}
        <div className="flex flex-col space-y-1.5">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            {...register("description")}
            placeholder="Event description"
            rows={4}
          />
          <p className="text-xs text-destructive min-h-[1rem]">
            {errors.description?.message}
          </p>
        </div>

        {/* Dates with one functional, theme-aware calendar icon */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="startTime">Start Time</Label>
            <div className="relative">
              <Input
                id="startTime"
                type="datetime-local"
                {...register("startTime")}
                ref={startTimeRef}
                className="no-native-icon pr-10"
              />
              <button
                type="button"
                onClick={() => openPicker(startTimeRef)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0 m-0 border-none bg-transparent cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-destructive min-h-[1rem]">
              {errors.startTime?.message}
            </p>
          </div>

          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="endTime">End Time (optional)</Label>
            <div className="relative">
              <Input
                id="endTime"
                type="datetime-local"
                {...register("endTime")}
                ref={endTimeRef}
                className="no-native-icon pr-10"
              />
              <button
                type="button"
                onClick={() => openPicker(endTimeRef)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0 m-0 border-none bg-transparent cursor-pointer text-muted-foreground hover:text-foreground transition-colors"
              >
                <Calendar className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Event Type */}
        <div className="flex flex-col space-y-1.5">
          <Label>Event Type</Label>
          <Select
            value={eventType}
            onValueChange={(v) => setValue("eventType", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="free">Free</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Category */}
        <div className="flex flex-col space-y-1.5">
          <Label>Category</Label>
          <Select
            value={categoryValue}
            onValueChange={(v) => setValue("category", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-destructive min-h-[1rem]">
            {errors.category?.message}
          </p>
        </div>

        {/* Location */}
        <div className="flex flex-col space-y-1.5">
          <Label>Location Type</Label>
          <Select value={mode} onValueChange={(v) => setValue("mode", v)}>
            <SelectTrigger>
              <SelectValue placeholder="Physical or Virtual" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="physical">Physical</SelectItem>
              <SelectItem value="virtual">Virtual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {mode === "physical" && (
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Input
              id="address"
              {...register("address")}
              placeholder="Event address"
            />
          </div>
        )}

        {mode === "virtual" && (
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="link">Meeting Link</Label>
            <Input
              id="link"
              {...register("link")}
              placeholder="Zoom / Google Meet link"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleBack}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button type="submit" className="w-full sm:w-auto">
            Create Event
          </Button>
        </div>
      </form>

      {/* Success dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle2 className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <DialogTitle>Event created</DialogTitle>
                <DialogDescription>
                  Your event has been created successfully.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            🎉 Your event is now live. You can manage tickets, registrations,
            and details from your events page.
          </div>

          <DialogFooter className="mt-4 flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setShowSuccessDialog(false)}
            >
              Stay here
            </Button>
            <Button onClick={handleSuccessOk}>Go to my events</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
