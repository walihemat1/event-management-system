// src/pages/EventDetails.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";

import { getEvent } from "../features/events/eventsSlice";
import {
  fetchEventFeedback,
  addFeedback,
  updateFeedback,
  deleteFeedback,
} from "../features/feedback/feedbackSlice";
import {
  getMyRegistrations,
  cancelRegistration,
} from "../features/registration/registrationSlice";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

function formatDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString();
}

export default function EventDetails() {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // ---------- REDUX STATE ----------
  const {
    current: event,
    isLoading,
    error,
  } = useSelector((state) => state.events);

  const currentUser = useSelector((state) => state.auth?.user);

  const feedbackState = useSelector((state) => state.feedback.byEvent[eventId]);

  const feedbackActionLoading = useSelector(
    (state) => state.feedback.actionLoading
  );

  const feedbackItems = feedbackState?.items || [];
  const feedbackLoading = feedbackState?.loading || false;
  const feedbackError = feedbackState?.error || null;

  // registrations slice
  const myRegistrations = useSelector((state) => state.registrations.items);
  const registrationsLoading = useSelector(
    (state) => state.registrations.isLoading
  );
  const registrationsCancelLoading = useSelector(
    (state) => state.registrations.cancelLoading
  );

  // ---------- LOCAL STATE ----------
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [editingId, setEditingId] = useState(null);

  // random banner image from a third-party API (Picsum)
  const [randomImageUrl, setRandomImageUrl] = useState("");

  // ---------- EFFECTS ----------
  useEffect(() => {
    if (eventId) {
      dispatch(getEvent(eventId));
      dispatch(fetchEventFeedback(eventId));
    }
  }, [dispatch, eventId]);

  // load current user's registrations (so we know if they are registered)
  useEffect(() => {
    if (currentUser) {
      dispatch(getMyRegistrations());
    }
  }, [dispatch, currentUser]);

  // fetch a random image URL from Picsum for fallback banner
  useEffect(() => {
    let cancelled = false;

    const fetchRandomImage = async () => {
      try {
        // Picsum will redirect to a real image URL; fetch gives us the final URL
        const res = await fetch(
          `https://picsum.photos/1200/400?random=${eventId || "default"}`
        );
        if (!cancelled && res.ok) {
          setRandomImageUrl(res.url);
        }
      } catch (err) {
        console.error("Failed to fetch random image:", err);
      }
    };

    fetchRandomImage();

    return () => {
      cancelled = true;
    };
  }, [eventId]);

  // ---- find my feedback based on userId populated from backend ----
  const myFeedback = useMemo(() => {
    if (!currentUser) return null;
    const myId = currentUser.id || currentUser._id;
    if (!myId) return null;

    return (
      feedbackItems.find((f) => {
        const u = f.userId;
        if (!u) return false;

        // If populated: u is an object with _id
        if (typeof u === "object" && u._id) {
          return u._id.toString() === myId.toString() || u._id === myId;
        }

        // If not populated: u might be a string/ObjectId-like
        if (typeof u === "string") {
          return u.toString() === myId.toString();
        }

        if (u.toString) {
          return u.toString() === myId.toString();
        }

        return false;
      }) || null
    );
  }, [feedbackItems, currentUser]);

  const averageRating = useMemo(() => {
    if (!feedbackItems || feedbackItems.length === 0) return null;
    const total = feedbackItems.reduce((sum, f) => sum + (f.rating || 0), 0);
    return (total / feedbackItems.length).toFixed(1);
  }, [feedbackItems]);

  // If myFeedback exists, prefill form once
  useEffect(() => {
    if (myFeedback) {
      setEditingId(myFeedback._id);
      setRating(myFeedback.rating || 5);
      setComment(myFeedback.comment || "");
    }
  }, [myFeedback]);

  // ---- find my registration for this event ----
  const myRegistrationForEvent = useMemo(() => {
    if (!currentUser || !eventId || !myRegistrations) return null;

    return (
      myRegistrations.find((reg) => {
        if (!reg || !reg.eventId) return false;
        const eid = reg.eventId;

        // eventId may be populated (object with _id) or a raw ObjectId/string
        if (typeof eid === "object" && eid._id) {
          return eid._id.toString() === eventId.toString();
        }

        if (typeof eid === "string") {
          return eid.toString() === eventId.toString();
        }

        if (eid.toString) {
          return eid.toString() === eventId.toString();
        }

        return false;
      }) || null
    );
  }, [myRegistrations, currentUser, eventId]);

  const isRegistered =
    !!myRegistrationForEvent && myRegistrationForEvent.status === "active";

  // ---------- HANDLERS ----------
  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    try {
      // If user already has feedback, treat as update
      if (myFeedback || editingId) {
        const idToUse = editingId || myFeedback._id;
        await dispatch(
          updateFeedback({ feedbackId: idToUse, eventId, rating, comment })
        ).unwrap();
      } else {
        await dispatch(addFeedback({ eventId, rating, comment })).unwrap();
      }
    } catch (err) {
      console.error("Feedback error:", err);
    }
  };

  const handleEdit = (fb) => {
    setEditingId(fb._id);
    setRating(fb.rating || 5);
    setComment(fb.comment || "");
  };

  const handleDeleteFeedback = async (feedbackId) => {
    try {
      await dispatch(deleteFeedback({ feedbackId, eventId })).unwrap();
      if (editingId === feedbackId) {
        setEditingId(null);
        setComment("");
        setRating(5);
      }
    } catch (err) {
      console.error("Delete feedback error:", err);
    }
  };

  const handleCancelRegistration = async () => {
    if (!myRegistrationForEvent) return;
    try {
      await dispatch(cancelRegistration(myRegistrationForEvent._id)).unwrap();
    } catch (err) {
      console.error("Cancel registration error:", err);
    }
  };

  const renderStars = (value) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const active = i <= value;
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          className={`text-lg leading-none ${
            active
              ? "text-yellow-500 dark:text-yellow-400"
              : "text-muted-foreground"
          }`}
        >
          ★
        </button>
      );
    }
    return <div className="inline-flex gap-1">{stars}</div>;
  };

  // ---------- EARLY RETURNS AFTER HOOKS ----------
  if (isLoading && !event) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Card className="overflow-hidden">
          <Skeleton className="h-56 w-full" />
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isLoading && (error || !event)) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Event not found</h1>
        <p className="text-muted-foreground">
          We couldn’t find the event you’re looking for. It may have been
          removed or the link is incorrect.
        </p>
        <Button onClick={() => navigate("/events")}>Back to events</Button>
      </div>
    );
  }

  // ---------- DERIVED EVENT DATA ----------
  const categoryName =
    typeof event.categories === "object" && event.categories?.name
      ? event.categories.name
      : "Uncategorized";

  const isFree = event.eventType === "free";

  // ---------- RENDER ----------
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top bar: back + primary info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="space-y-2">
          <Button
            variant="ghost"
            className="px-0 w-fit text-sm"
            onClick={() => navigate(-1)}
          >
            ← Back
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {event.title}
          </h1>
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={
                event.status === "ongoing"
                  ? "default"
                  : event.status === "cancelled"
                  ? "destructive"
                  : "secondary"
              }
            >
              {event.status}
            </Badge>

            <Badge
              className={
                isFree
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200"
              }
            >
              {isFree ? "Free event" : "Paid event"}
            </Badge>

            <Badge
              variant="outline"
              className="border-primary/30 text-primary text-xs px-2 py-0.5"
            >
              {categoryName}
            </Badge>

            {isRegistered && (
              <Badge className="bg-emerald-600/90 text-white text-xs px-2 py-0.5">
                You’re registered
              </Badge>
            )}
          </div>

          {isRegistered && (
            <p className="text-xs text-emerald-700 dark:text-emerald-300">
              You have an active registration for this event.
            </p>
          )}
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => navigate(`/events/${event._id}/share`)}
          >
            Share
          </Button>

          {isRegistered ? (
            <Button
              variant="outline"
              className="w-full sm:w-auto border-amber-500 text-amber-700 dark:border-amber-400 dark:text-amber-200"
              onClick={handleCancelRegistration}
              disabled={registrationsCancelLoading}
            >
              {registrationsCancelLoading
                ? "Cancelling..."
                : "Cancel registration"}
            </Button>
          ) : (
            <Button
              onClick={() => navigate(`/events/${event._id}/register`)}
              className="w-full sm:w-auto font-semibold"
              disabled={registrationsLoading}
            >
              Register
            </Button>
          )}
        </div>
      </div>

      {/* Main event card */}
      <Card className="overflow-hidden border-border/70">
        {/* Banner */}
        {event.media?.bannerUrl || randomImageUrl ? (
          <div className="h-40 sm:h-56 md:h-64 w-full overflow-hidden">
            <img
              src={event.media?.bannerUrl || randomImageUrl}
              alt={event.title}
              className="h-full w-full object-cover"
            />
          </div>
        ) : (
          <div className="h-32 sm:h-40 w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">
            No banner image
          </div>
        )}

        <CardContent className="pt-6 space-y-6">
          {/* When & where */}
          <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Starts
              </p>
              <p className="text-sm font-medium">
                {formatDateTime(event.startTime)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Ends
              </p>
              <p className="text-sm font-medium">
                {formatDateTime(event.endTime)}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Location
              </p>
              {event.location?.mode === "virtual" ? (
                <div className="text-sm">
                  <p className="font-medium">Online</p>
                  {event.location?.link && (
                    <a
                      href={event.location.link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary text-xs underline break-all"
                    >
                      {event.location.link}
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-sm">
                  <p className="font-medium">In person</p>
                  <p className="text-muted-foreground">
                    {event.location?.address || "Address to be announced"}
                  </p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Description */}
          <section className="space-y-2">
            <h2 className="text-lg font-semibold">About this event</h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
              {event.description}
            </p>
          </section>

          {/* Media gallery (if any) */}
          {(event.media?.gallery?.length || 0) > 0 && (
            <>
              <Separator />
              <section className="space-y-2">
                <h2 className="text-lg font-semibold">Gallery</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {event.media.gallery.map((src, idx) => (
                    <div
                      key={idx}
                      className="h-20 sm:h-24 rounded-md overflow-hidden bg-muted"
                    >
                      <img
                        src={src}
                        alt={`Event image ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {/* FEEDBACK SECTION */}
          <Separator />

          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-lg font-semibold">Feedback</h2>
                <p className="text-xs text-muted-foreground">
                  Share your experience with this event.
                </p>
              </div>

              {averageRating && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="font-semibold">{averageRating}</span>
                  <span className="text-yellow-500 dark:text-yellow-400">
                    ★
                  </span>
                  <span className="text-muted-foreground text-xs">
                    ({feedbackItems.length} review
                    {feedbackItems.length === 1 ? "" : "s"})
                  </span>
                </div>
              )}
            </div>

            {/* Feedback form */}
            <Card className="border-dashed border-border/60 bg-muted/40">
              <CardContent className="pt-4 space-y-3">
                <form className="space-y-3" onSubmit={handleSubmitFeedback}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-xs uppercase tracking-wide text-muted-foreground">
                        Your rating
                      </span>
                      {renderStars(rating)}
                    </div>

                    {myFeedback && (
                      <p className="text-xs text-muted-foreground">
                        You’ve already left feedback. You can update or delete
                        it below.
                      </p>
                    )}
                  </div>

                  <Textarea
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      myFeedback
                        ? "Update your feedback..."
                        : "Tell others what you liked or what could be improved..."
                    }
                    className="text-sm"
                  />

                  <div className="flex justify-end gap-2">
                    {editingId && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-xs"
                        onClick={() => {
                          setEditingId(null);
                          setComment("");
                          setRating(5);
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      type="submit"
                      size="sm"
                      disabled={feedbackActionLoading || !comment.trim()}
                      className="text-xs font-semibold"
                    >
                      {editingId ? "Update feedback" : "Submit feedback"}
                    </Button>
                  </div>

                  {feedbackError && (
                    <p className="text-xs text-destructive mt-1">
                      {feedbackError}
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>

            {/* Feedback list */}
            <div className="space-y-3">
              {feedbackLoading && (
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              )}

              {!feedbackLoading && feedbackItems.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  No feedback yet. Be the first to share your thoughts!
                </p>
              )}

              {!feedbackLoading &&
                feedbackItems.length > 0 &&
                feedbackItems.map((fb) => {
                  // figure out if this feedback belongs to the current user
                  let isOwner = false;
                  if (currentUser) {
                    const myId = (
                      currentUser.id ||
                      currentUser._id ||
                      ""
                    ).toString();
                    const u = fb.userId;
                    if (u) {
                      if (typeof u === "object" && u._id) {
                        isOwner = u._id.toString() === myId;
                      } else if (typeof u === "string") {
                        isOwner = u.toString() === myId;
                      } else if (u.toString) {
                        isOwner = u.toString() === myId;
                      }
                    }
                  }

                  return (
                    <div
                      key={fb._id}
                      className="rounded-md border border-border/70 bg-muted/40 px-3 py-2 space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium">
                            {fb.userId?.fullName ||
                              fb.userId?.username ||
                              fb.userId?.email.split("@")[0] ||
                              "Anonymous"}
                          </p>
                          <p className="text-[10px] text-muted-foreground">
                            {fb.createdAt
                              ? formatDateTime(fb.createdAt)
                              : "Recently"}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <span className="font-semibold">{fb.rating}</span>
                          <span className="text-yellow-500 dark:text-yellow-400">
                            ★
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground whitespace-pre-line">
                        {fb.comment}
                      </p>

                      {isOwner && (
                        <div className="flex gap-2 justify-end pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-6 px-2 text-[10px]"
                            onClick={() => handleEdit(fb)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="xs"
                            className="h-6 px-2 text-[10px] text-destructive"
                            onClick={() => handleDeleteFeedback(fb._id)}
                            disabled={feedbackActionLoading}
                          >
                            Delete
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  );
}
