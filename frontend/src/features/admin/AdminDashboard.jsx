// src/pages/Admin/AdminPanel.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAdminDashboard } from "../../features/admin/adminSlice";
import { useToast } from "@/components/ui/use-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const PIE_COLORS = ["#0ea5e9", "#6366f1", "#22c55e", "#f97316", "#e11d48"];

export default function AdminPanel() {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const {
    stats,
    registrationsOverTime,
    ticketSummary,
    topEvents,
    topTickets,
    categoryBreakdown,
    pendingEvents,
    recentActivity,
    isLoading,
    error,
  } = useSelector((state) => state.admin);

  // Chart range filter: 7d or 30d (client-side)
  const [range, setRange] = useState("30d");

  // Activity pagination (client-side) - 10 items per page now
  const [activityPage, setActivityPage] = useState(1);
  const activityPageSize = 10;

  // Events pagination (Active & upcoming) - 10 items per page
  const [eventsPage, setEventsPage] = useState(1);
  const eventsPageSize = 10;

  useEffect(() => {
    dispatch(fetchAdminDashboard())
      .unwrap()
      .catch((err) => {
        console.error("Failed to load admin dashboard:", err);
        toast({
          title: "Failed to load admin dashboard",
          description: err || "Please try again later.",
          variant: "destructive",
        });
      });
  }, [dispatch, toast]);

  const formatNumber = (n) =>
    typeof n === "number" ? n.toLocaleString() : "—";

  const formatCurrency = (n) =>
    typeof n === "number"
      ? n.toLocaleString(undefined, {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        })
      : "—";

  // Filter registrations data for chart
  const filteredRegistrations = useMemo(() => {
    if (!registrationsOverTime || registrationsOverTime.length === 0) {
      return [];
    }

    if (range === "7d") {
      return registrationsOverTime.slice(-7);
    }

    return registrationsOverTime;
  }, [registrationsOverTime, range]);

  // Activity pagination logic
  const totalActivity = recentActivity?.length || 0;
  const totalActivityPages =
    totalActivity === 0 ? 1 : Math.ceil(totalActivity / activityPageSize);

  const currentActivityPage = Math.min(activityPage, totalActivityPages);
  const activityStartIndex = (currentActivityPage - 1) * activityPageSize;
  const activityPageItems = (recentActivity || []).slice(
    activityStartIndex,
    activityStartIndex + activityPageSize
  );

  const handlePrevActivityPage = () => {
    setActivityPage((p) => Math.max(1, p - 1));
  };

  const handleNextActivityPage = () => {
    setActivityPage((p) => Math.min(totalActivityPages, p + 1));
  };

  // Events pagination logic (Active & upcoming)
  const totalEventsCount = pendingEvents?.length || 0;
  const totalEventsPages =
    totalEventsCount === 0 ? 1 : Math.ceil(totalEventsCount / eventsPageSize);

  const currentEventsPage = Math.min(eventsPage, totalEventsPages);
  const eventsStartIndex = (currentEventsPage - 1) * eventsPageSize;
  const eventsPageItems = (pendingEvents || []).slice(
    eventsStartIndex,
    eventsStartIndex + eventsPageSize
  );

  const handlePrevEventsPage = () => {
    setEventsPage((p) => Math.max(1, p - 1));
  };

  const handleNextEventsPage = () => {
    setEventsPage((p) => Math.min(totalEventsPages, p + 1));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Overview of users, events, tickets, and platform activity.
          </p>
        </div>
      </div>

      {/* Errors */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="py-3 text-sm text-destructive">
            {error}
          </CardContent>
        </Card>
      )}

      {/* KPI CARDS: USERS + EVENTS + ACTIVE EVENTS + REGISTRATIONS */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total users</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatNumber(stats.totalUsers) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Everyone who can attend or create events.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total events</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatNumber(stats.totalEvents) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Includes upcoming, ongoing, ended and cancelled.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active events</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatNumber(stats.activeEvents) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Upcoming and ongoing events.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total registrations</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatNumber(stats.totalRegistrations) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Active registrations across all events.
          </CardContent>
        </Card>
      </div>

      {/* KPI CARDS: TICKETS + REVENUE */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tickets sold</CardDescription>
            <CardTitle className="text-2xl">
              {ticketSummary
                ? formatNumber(ticketSummary.totalTicketsSold)
                : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Out of{" "}
            <span className="font-medium">
              {ticketSummary ? formatNumber(ticketSummary.totalCapacity) : "—"}
            </span>{" "}
            available seats.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Sell-through rate</CardDescription>
            <CardTitle className="text-2xl">
              {ticketSummary
                ? `${ticketSummary.soldPercentage.toFixed(1)}%`
                : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Percentage of total available tickets sold.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total revenue</CardDescription>
            <CardTitle className="text-2xl">
              {ticketSummary ? formatCurrency(ticketSummary.totalRevenue) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            From{" "}
            <span className="font-medium">
              {ticketSummary
                ? formatNumber(ticketSummary.paidRegistrations)
                : "—"}
            </span>{" "}
            paid registrations.
          </CardContent>
        </Card>
      </div>

      {/* CHARTS ROW: REGISTRATIONS + CATEGORY PIE */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Registrations over time */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">
                Registrations over time
              </CardTitle>
              <CardDescription>Track how engagement evolves.</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={range === "7d" ? "default" : "outline"}
                onClick={() => setRange("7d")}
              >
                Last 7 days
              </Button>
              <Button
                size="sm"
                variant={range === "30d" ? "default" : "outline"}
                onClick={() => setRange("30d")}
              >
                Last 30 days
              </Button>
            </div>
          </CardHeader>
          <CardContent className="h-64">
            {filteredRegistrations && filteredRegistrations.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredRegistrations}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Registrations"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">
                Not enough data yet to display this chart.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Category breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Events by category</CardTitle>
            <CardDescription>
              Distribution of events across categories.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {categoryBreakdown && categoryBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="count"
                    nameKey="categoryName"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    wrapperStyle={{ fontSize: "10px" }}
                    layout="vertical"
                    verticalAlign="middle"
                    align="right"
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">
                No category data available.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROW: TOP EVENTS + TOP TICKETS */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Top events by registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top events</CardTitle>
            <CardDescription>
              Events with the highest number of registrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {topEvents && topEvents.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topEvents}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  {/* 🔹 Explicit color so bars aren't black */}
                  <Bar
                    dataKey="registrations"
                    name="Registrations"
                    fill="#6366f1" // indigo
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">
                No registration data for events yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top tickets by sold quantity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top ticket types</CardTitle>
            <CardDescription>
              Ticket types with the highest number of sales.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {topTickets && topTickets.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTickets}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="ticketName"
                    tick={{ fontSize: 10 }}
                    interval={0}
                    angle={-25}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value, name) => {
                      if (name === "quantitySold") {
                        return [value, "Tickets sold"];
                      }
                      if (name === "totalRevenue") {
                        return [formatCurrency(value), "Revenue"];
                      }
                      return [value, name];
                    }}
                  />
                  <Legend />
                  {/* 🔹 Explicit color so bars aren't black */}
                  <Bar
                    dataKey="quantitySold"
                    name="Tickets sold"
                    fill="#22c55e" // green
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">
                No ticket sales data yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ROW: ACTIVE/UPCOMING EVENTS + RECENT ACTIVITY */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Active / upcoming events with pagination */}
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">
                Active & upcoming events
              </CardTitle>
              <CardDescription>
                Events currently live or scheduled (not cancelled).
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {totalEventsCount > 0 && (
                <span>
                  Page {currentEventsPage} of {totalEventsPages}
                </span>
              )}
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={handlePrevEventsPage}
                  disabled={currentEventsPage <= 1}
                >
                  ‹
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={handleNextEventsPage}
                  disabled={currentEventsPage >= totalEventsPages}
                >
                  ›
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {eventsPageItems && eventsPageItems.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[35%]">Event</TableHead>
                      <TableHead>Created by</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {eventsPageItems.map((ev) => (
                      <TableRow key={ev.id}>
                        <TableCell className="font-medium">{ev.name}</TableCell>
                        <TableCell className="text-xs">
                          {ev.organizer}
                        </TableCell>
                        <TableCell className="text-xs">
                          {ev.date ? new Date(ev.date).toLocaleString() : "—"}
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline">{ev.status}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No active or upcoming events at the moment.
              </p>
            )}
          </CardContent>
        </Card>

        {/* RECENT ACTIVITY (with pagination: 10 per page) */}
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Recent activity</CardTitle>
              <CardDescription>
                Latest events and registrations across the platform.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {totalActivity > 0 && (
                <span>
                  Page {currentActivityPage} of {totalActivityPages}
                </span>
              )}
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={handlePrevActivityPage}
                  disabled={currentActivityPage <= 1}
                >
                  ‹
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={handleNextActivityPage}
                  disabled={currentActivityPage >= totalActivityPages}
                >
                  ›
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activityPageItems && activityPageItems.length > 0 ? (
              <ul className="space-y-2 text-xs">
                {activityPageItems.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start justify-between gap-3 rounded-md bg-muted/30 px-3 py-2"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {item.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground capitalize">
                        {item.type.replace("_", " ")}
                      </p>
                    </div>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {item.createdAt
                        ? new Date(item.createdAt).toLocaleString()
                        : ""}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">
                No recent activity yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading dashboard...</p>
      )}
    </div>
  );
}
