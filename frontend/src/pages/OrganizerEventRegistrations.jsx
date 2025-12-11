// src/pages/OrganizerEventRegistrations.jsx
import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";

import { getEvent } from "../features/events/eventsSlice";
import { getEventRegistrations } from "../features/registration/registrationSlice";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/use-toast";

import { Users, Download, Ticket, CalendarDays } from "lucide-react";

function formatDate(value) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  return d.toLocaleString();
}

export default function OrganizerEventRegistrations() {
  const { eventId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  // 👉 from events slice
  const { current: event, isLoading: eventLoading } = useSelector(
    (state) => state.events
  );

  // 👉 from registrations slice (RENAMED eventLoading → registrationsLoading)
  const {
    eventItems: registrations,
    eventLoading: registrationsLoading,
    eventError,
  } = useSelector((state) => state.registrations);

  useEffect(() => {
    if (eventId) {
      dispatch(getEvent(eventId));
      dispatch(getEventRegistrations(eventId));
    }
  }, [dispatch, eventId]);

  // combined loading flag
  const isLoading = eventLoading || registrationsLoading;

  const { totalRegistrations, totalTickets, totalRevenue } = useMemo(() => {
    if (!registrations || registrations.length === 0) {
      return {
        totalRegistrations: 0,
        totalTickets: 0,
        totalRevenue: 0,
      };
    }

    let regCount = 0;
    let ticketsCount = 0;
    let revenue = 0;

    registrations.forEach((r) => {
      regCount += 1;
      ticketsCount += r.quantity || 0;
      revenue += r.totalAmount || 0;
    });

    return {
      totalRegistrations: regCount,
      totalTickets: ticketsCount,
      totalRevenue: revenue,
    };
  }, [registrations]);

  // CSV export
  const handleExportCSV = () => {
    if (!registrations || registrations.length === 0) {
      toast({
        title: "No registrations",
        description: "There are no registrations to export yet.",
      });
      return;
    }

    const header = [
      "Attendee Name",
      "Attendee Email",
      "Ticket",
      "Quantity",
      "Total Amount",
      "Payment Status",
      "Status",
      "Registered At",
    ];

    const rows = registrations.map((r) => {
      const user = r.userId || {};
      const ticket = r.ticketId || {};
      return [
        user.fullName || "",
        user.email || "",
        ticket.name || "",
        r.quantity ?? "",
        r.totalAmount ?? "",
        r.paymentStatus || "",
        r.status || "",
        formatDate(r.createdAt),
      ];
    });

    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => {
            const value = cell == null ? "" : String(cell);
            if (value.includes(",") || value.includes('"')) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(",")
      )
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    const safeTitle = (event?.title || "event")
      .toLowerCase()
      .replace(/\s+/g, "-");
    link.download = `${safeTitle}-registrations.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  };

  // skeleton while event is still loading
  if (eventLoading && !event) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-6 w-32" />
        <Card>
          <CardContent className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-5 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="max-w-3xl mx-auto p-6 space-y-4 text-center">
        <h1 className="text-2xl font-semibold">Unable to load registrations</h1>
        <p className="text-muted-foreground">
          {eventError || "Something went wrong while loading registrations."}
        </p>
        <Button onClick={() => navigate("/organizer-events")}>
          Back to my events
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <Button
            variant="ghost"
            className="px-0 text-sm"
            onClick={() => navigate("/organizer-events")}
          >
            ← Back to my events
          </Button>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Registrations
          </h1>
          {event && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">{event.title}</span>{" "}
              <span className="mx-1">·</span>
              {event.startTime && (
                <>
                  <CalendarDays className="inline-block h-4 w-4 mr-1" />
                  {formatDate(event.startTime)}
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExportCSV}>
            <Download className="h-4 w-4 mr-1" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total registrations
                </p>
                <p className="mt-1 text-2xl font-bold">{totalRegistrations}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Tickets booked
                </p>
                <p className="mt-1 text-2xl font-bold">{totalTickets}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Total revenue
                </p>
                <p className="mt-1 text-2xl font-bold">
                  ${totalRevenue.toFixed(2)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>Attendees</span>
            <Badge variant="outline" className="text-xs">
              {registrations?.length || 0} record
              {registrations && registrations.length !== 1 ? "s" : ""}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-5 w-full" />
              ))}
            </div>
          ) : !registrations || registrations.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              No registrations yet for this event.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/60">
                  <tr className="border-b">
                    <th className="py-2 px-3 text-left font-medium">
                      Attendee
                    </th>
                    <th className="py-2 px-3 text-left font-medium">Ticket</th>
                    <th className="py-2 px-3 text-left font-medium">Qty</th>
                    <th className="py-2 px-3 text-left font-medium">Total</th>
                    <th className="py-2 px-3 text-left font-medium">Payment</th>
                    <th className="py-2 px-3 text-left font-medium">Status</th>
                    <th className="py-2 px-3 text-left font-medium">
                      Registered at
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.map((r) => {
                    const user = r.userId || {};
                    const ticket = r.ticketId || {};
                    return (
                      <tr
                        key={r._id}
                        className="border-b last:border-b-0 hover:bg-muted/40"
                      >
                        <td className="py-2 px-3">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {user.fullName || "Unknown"}
                            </span>
                            {user.email && (
                              <span className="text-xs text-muted-foreground">
                                {user.email}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-3">
                          <div className="flex flex-col">
                            <span>{ticket.name || "Ticket"}</span>
                            {ticket.price != null && (
                              <span className="text-xs text-muted-foreground">
                                {ticket.price > 0
                                  ? `$${ticket.price.toFixed(2)}`
                                  : "Free"}
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-2 px-3">{r.quantity}</td>

                        <td className="py-2 px-3">
                          {r.totalAmount > 0
                            ? `$${r.totalAmount.toFixed(2)}`
                            : "Free"}
                        </td>

                        <td className="py-2 px-3">
                          <Badge
                            variant={
                              r.paymentStatus === "paid"
                                ? "default"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            {r.paymentStatus || "pending"}
                          </Badge>
                        </td>

                        <td className="py-2 px-3">
                          <Badge
                            variant={
                              r.status === "cancelled"
                                ? "destructive"
                                : "outline"
                            }
                            className="text-xs"
                          >
                            {r.status || "active"}
                          </Badge>
                        </td>

                        <td className="py-2 px-3 text-xs text-muted-foreground">
                          {formatDate(r.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
