// src/pages/OrganizerEvents.jsx
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { getMyEvents } from "../features/events/eventsSlice";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Star, MoreHorizontal, CalendarDays } from "lucide-react";

import DeleteEvent from "../features/events/DeleteEvent";

export default function OrganizerEvents() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { myList: myEvents = [], isLoading } = useSelector(
    (state) => state.events
  );

  useEffect(() => {
    dispatch(getMyEvents());
  }, [dispatch]);

  if (isLoading) {
    return (
      <div className="p-6">
        <p>Loading your events...</p>
      </div>
    );
  }

  if (!isLoading && myEvents.length === 0) {
    return (
      <div className="p-10 flex flex-col items-center justify-center text-center space-y-6">
        <h1 className="text-3xl font-bold">No Events Yet</h1>

        <p className="text-muted-foreground max-w-md">
          You haven’t created any events yet. Start by creating your first event
          and make something amazing happen!
        </p>

        <Button onClick={() => navigate("/create-event")} className="mt-4">
          Create Your First Event
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl font-bold">My Events</h1>
        <Button
          onClick={() => navigate("/create-event")}
          className="w-full sm:w-auto"
        >
          Create new event
        </Button>
      </div>

      {/* Mobile: card list */}
      <div className="space-y-3 md:hidden">
        {myEvents.map((event) => {
          const avg = event.feedbackStats?.averageRating || 0;
          const count = event.feedbackStats?.totalReviews || 0;

          return (
            <Card key={event._id} className="border-border/70 bg-card/90">
              <CardHeader className="pb-3 flex flex-row items-start justify-between gap-2">
                <div className="space-y-1">
                  <CardTitle className="text-base font-semibold line-clamp-2">
                    {event.title}
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="outline" className="text-xs">
                      {event.eventType}
                    </Badge>
                    <Badge className="text-xs">
                      {typeof event.categories === "object" &&
                      event.categories?.name
                        ? event.categories.name
                        : event.categories}
                    </Badge>
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => navigate(`/events/${event._id}`)}
                    >
                      View
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate(`/events/${event._id}/tickets`)}
                    >
                      Manage tickets
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() =>
                        navigate(`/events/${event._id}/registrations`)
                      }
                    >
                      View registrations
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate(`/events/${event._id}/edit`)}
                    >
                      Edit
                    </DropdownMenuItem>

                    <DeleteEvent eventId={event._id} title={event.title} />
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                <div className="flex items-center justify-between text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5" />
                    <span>
                      {event.startTime
                        ? new Date(event.startTime).toLocaleString()
                        : "N/A"}
                    </span>
                  </div>
                  <Badge
                    variant={
                      event.status === "ongoing"
                        ? "default"
                        : event.status === "cancelled"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[11px]"
                  >
                    {event.status}
                  </Badge>
                </div>

                {/* Rating */}
                <div className="flex items-center justify-between">
                  {count > 0 ? (
                    <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                      <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xs font-medium">
                        {avg.toFixed(1)}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        ({count})
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground">
                      No reviews yet
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Desktop / tablet: table */}
      <div className="rounded-md border overflow-x-auto bg-card hidden md:block">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th className="py-3 px-4 text-left font-medium">Title</th>
              <th className="py-3 px-4 text-left font-medium">Type</th>
              <th className="py-3 px-4 text-left font-medium">Category</th>
              <th className="py-3 px-4 text-left font-medium">Start</th>
              <th className="py-3 px-4 text-left font-medium">End</th>
              <th className="py-3 px-4 text-left font-medium">Status</th>
              <th className="py-3 px-4 text-left font-medium">Rating</th>
              <th className="py-3 px-4 text-left font-medium">Actions</th>
            </tr>
          </thead>

          <tbody>
            {myEvents.map((event) => {
              const avg = event.feedbackStats?.averageRating || 0;
              const count = event.feedbackStats?.totalReviews || 0;

              return (
                <tr
                  key={event._id}
                  className="border-t hover:bg-muted/40 transition"
                >
                  <td className="py-3 px-4">{event.title}</td>

                  <td className="py-3 px-4">
                    <Badge variant="outline">{event.eventType}</Badge>
                  </td>

                  <td className="py-3 px-4">
                    <Badge>
                      {typeof event.categories === "object" &&
                      event.categories?.name
                        ? event.categories.name
                        : event.categories}
                    </Badge>
                  </td>

                  <td className="py-3 px-4">
                    {event.startTime
                      ? new Date(event.startTime).toLocaleString()
                      : "N/A"}
                  </td>

                  <td className="py-3 px-4">
                    {event.endTime
                      ? new Date(event.endTime).toLocaleString()
                      : "N/A"}
                  </td>

                  <td className="py-3 px-4">
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
                  </td>

                  {/* Rating column */}
                  <td className="py-3 px-4">
                    {count > 0 ? (
                      <div className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs font-medium">
                          {avg.toFixed(1)}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          ({count})
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        No reviews
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          ⋮
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        {/* VIEW */}
                        <DropdownMenuItem
                          onClick={() => navigate(`/events/${event._id}`)}
                        >
                          View
                        </DropdownMenuItem>

                        {/* MANAGE TICKETS */}
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/events/${event._id}/tickets`)
                          }
                        >
                          Manage tickets
                        </DropdownMenuItem>

                        {/* VIEW REGISTRATIONS */}
                        <DropdownMenuItem
                          onClick={() =>
                            navigate(`/events/${event._id}/registrations`)
                          }
                        >
                          View registrations
                        </DropdownMenuItem>

                        {/* EDIT */}
                        <DropdownMenuItem
                          onClick={() => navigate(`/events/${event._id}/edit`)}
                        >
                          Edit
                        </DropdownMenuItem>

                        {/* DELETE */}
                        <DeleteEvent eventId={event._id} title={event.title} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
