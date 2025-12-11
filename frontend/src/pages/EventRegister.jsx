// src/pages/EventRegister.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";

import { getEvent } from "../features/events/eventsSlice";
import { fetchTickets } from "../features/tickets/ticketsSlice";
import {
  createRegistration,
  getMyRegistrations,
  cancelRegistration,
} from "../features/registration/registrationSlice";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

import { Clock, MapPin, Ticket, Users } from "lucide-react";

function formatDateTime(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString();
}

export default function EventRegister() {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const { current: event, isLoading: eventLoading } = useSelector(
    (state) => state.events
  );

  const { items: tickets, isLoading: ticketsLoading } = useSelector(
    (state) => state.tickets
  );

  const {
    items: registrations,
    isLoading: registrationsLoading,
    createLoading: registrationLoading,
    cancelLoading,
  } = useSelector((state) => state.registrations);

  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Load event + tickets + my registrations
  useEffect(() => {
    if (eventId) {
      dispatch(getEvent(eventId));
      dispatch(fetchTickets(eventId));
      dispatch(getMyRegistrations());
    }
  }, [dispatch, eventId]);

  // find existing registration for this event
  const myRegistrationForEvent = useMemo(() => {
    if (!registrations || !eventId) return null;
    return registrations.find((r) => {
      const id =
        typeof r.eventId === "object" ? r.eventId?._id?.toString() : r.eventId;
      return id === eventId;
    });
  }, [registrations, eventId]);

  const isEventPast = useMemo(() => {
    if (!event?.endTime) return false;
    return new Date(event.endTime) < new Date();
  }, [event]);

  const { isActiveRegistration, currentStatusLabel } = useMemo(() => {
    if (!myRegistrationForEvent) {
      return {
        isActiveRegistration: false,
        currentStatusLabel: null,
      };
    }

    const status = myRegistrationForEvent.status || "active";

    if (status === "cancelled") {
      return {
        isActiveRegistration: false,
        currentStatusLabel: "Cancelled",
      };
    }

    if (isEventPast) {
      return {
        isActiveRegistration: false,
        currentStatusLabel: "Past event",
      };
    }

    return {
      isActiveRegistration: true,
      currentStatusLabel: "Registered",
    };
  }, [myRegistrationForEvent, isEventPast]);

  // Default ticket selection
  useEffect(() => {
    if (tickets && tickets.length > 0 && !selectedTicketId) {
      setSelectedTicketId(tickets[0]._id);
    }
  }, [tickets, selectedTicketId]);

  const selectedTicket = useMemo(
    () => tickets?.find((t) => t._id === selectedTicketId) || null,
    [tickets, selectedTicketId]
  );

  const maxQuantity = selectedTicket
    ? Math.max(
        (selectedTicket.quantityAvailable ?? 0) -
          (selectedTicket.quantitySold ?? 0),
        0
      ) ||
      (selectedTicket.quantityAvailable ?? 0)
    : 0;

  const safeQuantity =
    quantity < 1 ? 1 : maxQuantity > 0 ? Math.min(quantity, maxQuantity) : 1;

  const totalAmount = useMemo(() => {
    if (!selectedTicket) return 0;
    const price = selectedTicket.price ?? 0;
    return price * safeQuantity;
  }, [selectedTicket, safeQuantity]);

  const isFree = selectedTicket ? (selectedTicket.price ?? 0) <= 0 : false;

  const isLoading = eventLoading || ticketsLoading || registrationsLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventId || !selectedTicket) return;

    if (maxQuantity <= 0) {
      toast({
        variant: "destructive",
        title: "Tickets sold out",
        description: "No more tickets are available for this ticket type.",
      });
      return;
    }

    try {
      await dispatch(
        createRegistration({
          eventId,
          ticketId: selectedTicket._id,
          quantity: safeQuantity,
          totalAmount,
          paymentMethod: isFree ? "free" : "manual",
        })
      ).unwrap();

      dispatch(fetchTickets(eventId));
      dispatch(getMyRegistrations());

      toast({
        title: "Registration successful",
        description: isFree
          ? "You are registered for this event."
          : "Registration created. Complete payment as instructed by the organizer.",
      });

      navigate(`/events/${eventId}`);
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Registration failed",
        description:
          typeof err === "string"
            ? err
            : "Something went wrong while registering.",
      });
    }
  };

  const handleCancelRegistration = async () => {
    if (!myRegistrationForEvent) return;

    try {
      await dispatch(cancelRegistration(myRegistrationForEvent._id)).unwrap();
      dispatch(fetchTickets(eventId));
      dispatch(getMyRegistrations());

      toast({
        title: "Registration cancelled",
        description: "Your registration has been cancelled successfully.",
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Failed to cancel",
        description:
          typeof err === "string"
            ? err
            : "Something went wrong while cancelling registration.",
      });
    }
  };

  // ---------- LOADING ----------
  if (isLoading && !event) {
    return (
      <div className="max-w-5xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ---------- NO EVENT ----------
  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center space-y-4">
        <h1 className="text-2xl font-semibold">Event not found</h1>
        <p className="text-muted-foreground">
          We couldn&apos;t find the event you&apos;re trying to register for.
        </p>
        <Button onClick={() => navigate("/events")}>Back to events</Button>
      </div>
    );
  }

  const hasTickets = tickets && tickets.length > 0;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      <Button
        variant="ghost"
        className="px-0 mb-2 text-sm"
        onClick={() => navigate(-1)}
      >
        ← Back
      </Button>

      <div className="grid gap-6 md:grid-cols-3">
        {/* LEFT: Event summary (unchanged) */}
        <Card className="md:col-span-2 border-border/70">
          <CardHeader>
            <CardTitle className="flex flex-col gap-2">
              <span className="text-2xl font-bold tracking-tight">
                {event.title}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {event.eventType && (
                  <Badge variant="outline" className="text-xs">
                    {event.eventType === "free" ? "Free event" : "Paid event"}
                  </Badge>
                )}

                {event.status && (
                  <Badge
                    variant={
                      event.status === "ongoing"
                        ? "default"
                        : event.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-xs"
                  >
                    {event.status}
                  </Badge>
                )}

                {event.categories && (
                  <Badge
                    variant="outline"
                    className="border-primary/30 text-primary text-xs"
                  >
                    {typeof event.categories === "object" &&
                    event.categories?.name
                      ? event.categories.name
                      : event.categories}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1 text-sm">
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

              <div className="space-y-1 text-sm">
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
                        {event.location?.address || "Address to be announced"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {event.description && (
              <>
                <Separator />
                <div className="space-y-1 text-sm">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    About
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-line">
                    {event.description}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* RIGHT: Already registered OR Registration form */}
        <Card className="border-border/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Ticket className="h-4 w-4" />
              {isActiveRegistration
                ? "You are registered"
                : "Register for this event"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {myRegistrationForEvent && (
              <div className="rounded-md border border-border bg-muted/40 p-3 text-sm flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">
                    Status: {currentStatusLabel}
                  </span>
                  <Badge
                    variant={
                      currentStatusLabel === "Cancelled"
                        ? "destructive"
                        : currentStatusLabel === "Past event"
                        ? "secondary"
                        : "default"
                    }
                    className="text-xs"
                  >
                    {currentStatusLabel}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  Ticket:{" "}
                  {typeof myRegistrationForEvent.ticketId === "object"
                    ? myRegistrationForEvent.ticketId?.name
                    : "Ticket"}
                  {" • "}
                  Qty: {myRegistrationForEvent.quantity}
                </p>
              </div>
            )}

            {isActiveRegistration && !isEventPast ? (
              <div className="space-y-3 text-sm">
                <p className="text-muted-foreground">
                  You&apos;re already registered for this event.
                  <br />
                  To change ticket type or quantity, cancel and register again.
                </p>

                {/* Confirm cancel dialog */}
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full"
                      disabled={cancelLoading}
                    >
                      {cancelLoading
                        ? "Cancelling..."
                        : "Cancel my registration"}
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Cancel registration?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will free your tickets and you&apos;ll need to
                        register again if you change your mind. This action
                        can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>
                        Keep my registration
                      </AlertDialogCancel>
                      <AlertDialogAction onClick={handleCancelRegistration}>
                        Yes, cancel it
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <Button
                  variant="ghost"
                  className="w-full text-xs"
                  onClick={() => navigate("/my-registrations")}
                >
                  View all my registrations
                </Button>
              </div>
            ) : isEventPast ? (
              <p className="text-sm text-muted-foreground">
                This event has already ended. Registration is closed.
              </p>
            ) : !hasTickets ? (
              <p className="text-sm text-muted-foreground">
                The organizer hasn&apos;t added ticket types yet, or tickets are
                not available.
              </p>
            ) : (
              // Show registration form (same as before)
              <form className="space-y-4" onSubmit={handleSubmit}>
                {/* Ticket selection */}
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">
                    Choose a ticket
                  </p>

                  <div className="space-y-2">
                    {tickets.map((ticket) => {
                      const available = ticket.quantityAvailable ?? 0;
                      const sold = ticket.quantitySold ?? 0;
                      const remaining = Math.max(available - sold, 0);
                      const soldOut = available > 0 && remaining <= 0;
                      const isSelected = selectedTicketId === ticket._id;

                      return (
                        <button
                          key={ticket._id}
                          type="button"
                          onClick={() =>
                            !soldOut && setSelectedTicketId(ticket._id)
                          }
                          className={`w-full rounded-md border px-3 py-2 text-left text-sm transition-all ${
                            soldOut
                              ? "opacity-60 cursor-not-allowed bg-muted/60"
                              : "cursor-pointer hover:bg-accent/40"
                          } ${
                            isSelected
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div>
                              <p className="font-medium">{ticket.name}</p>
                              {ticket.description && (
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {ticket.description}
                                </p>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-1 text-xs">
                              <span className="font-semibold">
                                {ticket.price && ticket.price > 0
                                  ? `$${ticket.price.toFixed(2)}`
                                  : "Free"}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                                <Users className="h-3 w-3" />
                                {soldOut
                                  ? "Sold out"
                                  : `${remaining} left / ${available} total`}
                              </span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Quantity */}
                {selectedTicket && (
                  <div className="space-y-2">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Quantity
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={1}
                        max={maxQuantity || 1}
                        value={safeQuantity}
                        onChange={(e) =>
                          setQuantity(Number(e.target.value) || 1)
                        }
                        className="w-24"
                      />
                      <span className="text-xs text-muted-foreground">
                        Max {maxQuantity || 1}
                      </span>
                    </div>
                  </div>
                )}

                <Separator />

                {/* Summary */}
                <div className="space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Ticket price</span>
                    <span className="font-medium">
                      {selectedTicket && selectedTicket.price > 0
                        ? `$${selectedTicket.price.toFixed(2)}`
                        : "Free"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Quantity</span>
                    <span className="font-medium">{safeQuantity}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-sm font-semibold">Total</span>
                    <span className="text-lg font-bold">
                      {totalAmount > 0 ? `$${totalAmount.toFixed(2)}` : "Free"}
                    </span>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full mt-2"
                  disabled={
                    registrationLoading || !selectedTicket || maxQuantity <= 0
                  }
                >
                  {registrationLoading
                    ? "Registering..."
                    : maxQuantity <= 0
                    ? "Tickets sold out"
                    : isFree
                    ? "Register"
                    : "Register (manual payment)"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
