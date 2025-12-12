import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function EventCard({ event }) {
  return (
    <Card className="overflow-hidden">
      <img
        src={event.bannerUrl}
        alt={event.title}
        className="h-48 w-full object-cover"
      />
      <CardHeader>
        <CardTitle className="text-lg">{event.title}</CardTitle>
        <p className="text-sm text-muted-foreground">
          {event.location} • {new Date(event.startDate).toLocaleString()}
        </p>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <Button asChild>
          <Link to={`/events/${event.id}`}>View</Link>
        </Button>
        <span className="text-sm font-medium">{event.ticketCount} tickets</span>
      </CardContent>
    </Card>
  );
}
