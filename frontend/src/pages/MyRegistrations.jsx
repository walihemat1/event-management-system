// src/pages/MyRegistrations.jsx
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import {
  getMyRegistrations,
  cancelRegistration,
} from "../features/registration/registrationSlice";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";

import { Clock, MapPin, Ticket, Users } from "lucide-react";

function formatDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString();
}

export default function MyRegistrations() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { items, isLoading, cancelLoading } = useSelector(
    (state) => state.registrations
  );

  useEffect(() => {
    dispatch(getMyRegistrations());
  }, [dispatch]);

  const sorted = useMemo(() => {
    if (!items) return [];
    return [...items].sort((a, b) => {
      const aDate = a.eventId?.startTime
        ? new Date(a.eventId.startTime)
        : new Date(0);
      const bDate = b.eventId?.startTime
        ? new Date(b.eventId.startTime)
        : new Date(0);
      return aDate - bDate;
    });
  }, [items]);

  const getStatusLabel = (reg) => {
    const status = reg.status || "active";
    const eventEnd = reg.eventId?.endTime
      ? new Date(reg.eventId.endTime)
      : null;
    const isPast = eventEnd && eventEnd < new Date();

    if (status === "cancelled") return "Cancelled";
    if (isPast) return "Past event";
    return "Registered";
  };

  const getStatusVariant = (label) => {
    if (label === "Cancelled") return "destructive";
    if (label === "Past event") return "secondary";
    return "default";
  };

  const handleCancel = async (reg) => {
    const label = getStatusLabel(reg);
    if (label !== "Registered") return;

    try {
      await dispatch(cancelRegistration(reg._id)).unwrap();
      toast({
        title: "Registration cancelled",
        description: "Your registration has been cancelled.",
      });
      dispatch(getMyRegistrations());
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to cancel",
        description:
          typeof err === "string"
            ? err
            : "Something went wrong while cancelling.",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <h1 className="text-3xl font-bold">My Registrations</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="pt-4 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-40" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!isLoading && sorted.length === 0) {
    return (
      <div className="max-w-2xl mx-auto p-10 text-center space-y-4">
        <h1 className="text-3xl font-bold">No registrations yet</h1>
        <p className="text-muted-foreground">
          You haven&apos;t registered for any events yet. Browse events and book
          your spot.
        </p>
        <Button onClick={() => navigate("/events")}>Browse events</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-3xl font-bold">My Registrations</h1>
        <Button variant="outline" size="sm" onClick={() => navigate("/events")}>
          Browse events
        </Button>
      </div>

      <div className="space-y-4">
        {sorted.map((reg) => {
          const event = reg.eventId || {};
          const ticket = reg.ticketId || {};
          const statusLabel = getStatusLabel(reg);
          const statusVariant = getStatusVariant(statusLabel);
          const isPast = event.endTime && new Date(event.endTime) < new Date();
          const canCancel = statusLabel === "Registered" && !isPast;

          return (
            <Card
              key={reg._id}
              className="border-border/70 hover:border-primary/30 hover:shadow-sm transition-all"
            >
              <CardHeader className="flex flex-row items-center justify-between gap-3">
                <div className="space-y-1">
                  <CardTitle
                    className="text-lg cursor-pointer hover:text-primary"
                    onClick={() =>
                      event._id && navigate(`/events/${event._id}`)
                    }
                  >
                    {event.title || "Event"}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={statusVariant} className="text-xs">
                      {statusLabel}
                    </Badge>
                    {event.status && (
                      <Badge
                        variant="outline"
                        className="text-xs border-border/60"
                      >
                        {event.status}
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs text-muted-foreground">
                  <p>Registered on</p>
                  <p className="font-medium">{formatDateTime(reg.createdAt)}</p>
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      When
                    </p>
                    <div className="flex flex-col gap-0.5">
                      <div className="inline-flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatDateTime(event.startTime)}
                        </span>
                      </div>
                      {event.endTime && (
                        <span className="text-xs text-muted-foreground">
                          Ends: {formatDateTime(event.endTime)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Where
                    </p>
                    {event.location?.mode === "virtual" ? (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">Online</p>
                          {event.location?.link && (
                            <a
                              href={event.location.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-primary underline break-all"
                            >
                              {event.location.link}
                            </a>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium">In person</p>
                          <p className="text-xs text-muted-foreground">
                            {event.location?.address ||
                              "Address to be announced"}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Ticket
                    </p>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Ticket className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {ticket.name || "Ticket"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Qty: {reg.quantity}</span>
                        <span>•</span>
                        <span>
                          {ticket.price && ticket.price > 0
                            ? `$${ticket.price.toFixed(2)} each`
                            : "Free"}
                        </span>
                      </div>
                      <p className="text-xs font-semibold">
                        Total:{" "}
                        {reg.totalAmount > 0
                          ? `$${reg.totalAmount.toFixed(2)}`
                          : "Free"}
                      </p>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      event._id && navigate(`/events/${event._id}`)
                    }
                  >
                    View event
                  </Button>

                  {canCancel && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(reg)}
                      disabled={cancelLoading}
                    >
                      {cancelLoading ? "Cancelling..." : "Cancel registration"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
