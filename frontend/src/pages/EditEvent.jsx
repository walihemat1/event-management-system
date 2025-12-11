// src/pages/EditEvent.jsx
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

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

import { Calendar, CheckCircle2, ArrowLeft } from "lucide-react";

import { getEvent, updateEvent } from "../features/events/eventsSlice";
import { getCategories } from "../features/category/categorySlice";

// same schema as create, now with status
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
  status: z.enum(["upcoming", "ongoing", "ended", "cancelled"], {
    required_error: "Select a status",
  }),
});

export default function EditEvent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { eventId } = useParams();

  const { current: event, isLoading } = useSelector((state) => state.events);
  const { list: categories } = useSelector((state) => state.category);

  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

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
      status: "upcoming",
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
  const statusValue = watch("status");

  // load event + categories
  useEffect(() => {
    if (eventId) {
      dispatch(getEvent(eventId));
    }
    if (categories.length === 0) {
      dispatch(getCategories());
    }
  }, [dispatch, eventId, categories.length]);

  // when event arrives, populate form
  useEffect(() => {
    if (!event) return;

    const location = event.location || {};
    const modeValue = location.mode || "physical";

    // category: handle populated, array, or id
    let categoryId = "";
    const cat = event.categories;

    if (Array.isArray(cat)) {
      const first = cat[0];
      if (first && typeof first === "object" && first._id) {
        categoryId = first._id.toString();
      } else if (first) {
        categoryId = String(first);
      }
    } else if (cat && typeof cat === "object") {
      categoryId = cat._id?.toString() || "";
    } else if (typeof cat === "string") {
      categoryId = cat;
    } else if (cat) {
      categoryId = String(cat);
    }

    reset({
      title: event.title || "",
      description: event.description || "",
      startTime: event.startTime
        ? new Date(event.startTime).toISOString().slice(0, 16)
        : "",
      endTime: event.endTime
        ? new Date(event.endTime).toISOString().slice(0, 16)
        : "",
      eventType: event.eventType || "free",
      mode: modeValue,
      address: location.address || "",
      link: location.link || "",
      category: categoryId,
      status: event.status || "upcoming",
    });
  }, [event, reset]);

  const onSubmit = async (values) => {
    if (!eventId) return;

    const payload = {
      title: values.title,
      description: values.description,
      startTime: values.startTime,
      endTime: values.endTime || null,
      eventType: values.eventType,
      status: values.status, // ✅ include status
      categories: values.category,
      location: {
        mode: values.mode,
        address: values.mode === "physical" ? values.address : "",
        link: values.mode === "virtual" ? values.link : "",
      },
      media: event?.media || {
        bannerUrl: "",
        gallery: [],
        videos: [],
      },
    };

    try {
      await dispatch(updateEvent({ eventId, payload })).unwrap();
      setShowSuccessDialog(true);
    } catch (err) {
      console.error("Failed to update event", err);
    }
  };

  const handleBack = () => {
    if (window.history.length > 2) navigate(-1);
    else navigate("/organizer-events");
  };

  const handleSuccessOk = () => {
    setShowSuccessDialog(false);
    navigate("/organizer-events");
  };

  // helper to open native picker from our icon
  const openPickerById = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (typeof el.showPicker === "function") el.showPicker();
    else el.focus();
  };

  if (isLoading && !event) {
    return <p className="text-center py-8">Loading event...</p>;
  }

  if (!isLoading && !event) {
    return (
      <p className="text-center py-8">
        Event not found or you do not have access.
      </p>
    );
  }

  return (
    <>
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="max-w-3xl mx-auto p-6 md:p-8 rounded-xl border bg-card shadow-sm space-y-6"
      >
        {/* Header + Back button */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight">
              Edit Event
            </h2>
            <p className="text-sm text-muted-foreground">
              Update details, schedule, location, and status of your event.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleBack}
            className="inline-flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
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

        {/* Dates */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="startTime">Start Time</Label>
            <div className="relative">
              <Input
                id="startTime"
                type="datetime-local"
                {...register("startTime")}
                className="no-native-icon pr-10"
              />
              <button
                type="button"
                onClick={() => openPickerById("startTime")}
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
                className="no-native-icon pr-10"
              />
              <button
                type="button"
                onClick={() => openPickerById("endTime")}
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
          <p className="text-xs text-destructive min-h-[1rem]">
            {errors.eventType?.message}
          </p>
        </div>

        {/* Status */}
        <div className="flex flex-col space-y-1.5">
          <Label>Status</Label>
          <Select
            value={statusValue}
            onValueChange={(v) => setValue("status", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="ongoing">Ongoing</SelectItem>
              <SelectItem value="ended">Ended</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-destructive min-h-[1rem]">
            {errors.status?.message}
          </p>
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
            Save changes
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
                <DialogTitle>Event updated</DialogTitle>
                <DialogDescription>
                  Your event has been updated successfully.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="mt-4 rounded-lg border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
            ✅ Status and other details are now live. If you mark it as
            cancelled or change timing, your backend notification logic will
            take care of informing attendees.
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
