// src/pages/Dashboard/UserDashboard.jsx
import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAttendeeDashboard } from "./attendeeSlice";
import { useToast } from "@/components/ui/use-toast";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
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
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  BarChart,
  Bar,
} from "recharts";

export default function UserDashboard() {
  const dispatch = useDispatch();
  const { toast } = useToast();

  const {
    stats,
    upcomingRegistrations,
    pastRegistrations,
    myRegistrationsOverTime,
    myTopEvents,
    recentActivity,
    isLoading,
    error,
  } = useSelector((state) => state.attendeeDashboard);

  // Chart range filter
  const [range, setRange] = useState("30d");

  // Pagination states (10 per page)
  const [upcomingPage, setUpcomingPage] = useState(1);
  const [pastPage, setPastPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  const pageSize = 10;

  useEffect(() => {
    dispatch(fetchAttendeeDashboard())
      .unwrap()
      .catch((err) => {
        toast({
          title: "Failed to load your dashboard",
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

  // Chart data filter
  const filteredRegs = useMemo(() => {
    if (!myRegistrationsOverTime || myRegistrationsOverTime.length === 0)
      return [];
    if (range === "7d") return myRegistrationsOverTime.slice(-7);
    return myRegistrationsOverTime;
  }, [myRegistrationsOverTime, range]);

  // ------ UPCOMING EVENTS PAGINATION ------
  const totalUpcoming = upcomingRegistrations?.length || 0;
  const totalUpcomingPages =
    totalUpcoming === 0 ? 1 : Math.ceil(totalUpcoming / pageSize);
  const currentUpcomingPage = Math.min(upcomingPage, totalUpcomingPages);
  const upcomingStartIndex = (currentUpcomingPage - 1) * pageSize;
  const upcomingPageItems = (upcomingRegistrations || []).slice(
    upcomingStartIndex,
    upcomingStartIndex + pageSize
  );

  const handlePrevUpcoming = () => setUpcomingPage((p) => Math.max(1, p - 1));
  const handleNextUpcoming = () =>
    setUpcomingPage((p) => Math.min(totalUpcomingPages, p + 1));

  // ------ PAST EVENTS PAGINATION ------
  const totalPast = pastRegistrations?.length || 0;
  const totalPastPages = totalPast === 0 ? 1 : Math.ceil(totalPast / pageSize);
  const currentPastPage = Math.min(pastPage, totalPastPages);
  const pastStartIndex = (currentPastPage - 1) * pageSize;
  const pastPageItems = (pastRegistrations || []).slice(
    pastStartIndex,
    pastStartIndex + pageSize
  );

  const handlePrevPast = () => setPastPage((p) => Math.max(1, p - 1));
  const handleNextPast = () =>
    setPastPage((p) => Math.min(totalPastPages, p + 1));

  // ------ RECENT ACTIVITY PAGINATION ------
  const totalActivity = recentActivity?.length || 0;
  const totalActivityPages =
    totalActivity === 0 ? 1 : Math.ceil(totalActivity / pageSize);
  const currentActivityPage = Math.min(activityPage, totalActivityPages);
  const activityStartIndex = (currentActivityPage - 1) * pageSize;
  const activityPageItems = (recentActivity || []).slice(
    activityStartIndex,
    activityStartIndex + pageSize
  );

  const handlePrevActivity = () => setActivityPage((p) => Math.max(1, p - 1));
  const handleNextActivity = () =>
    setActivityPage((p) => Math.min(totalActivityPages, p + 1));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            My Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            See the events you&apos;re attending and how your events are
            performing.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" size="sm">
            <a href="/events">Browse events</a>
          </Button>
          <Button asChild size="sm">
            <a href="/create-event">Create event</a>
          </Button>
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

      {/* STATS ROW: ATTENDEE */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming registrations</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatNumber(stats.upcomingRegistrationsCount) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Events you&apos;re going to attend.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Past events attended</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatNumber(stats.pastRegistrationsCount) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Events already in your history.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Tickets owned</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatNumber(stats.totalTicketsOwned) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Across all your registrations.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total spent</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatCurrency(stats.totalSpent) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Only paid registrations are counted.
          </CardContent>
        </Card>
      </div>

      {/* STATS ROW: CREATOR */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Events I created</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatNumber(stats.myEventsCount) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Events where you are the creator.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active events I created</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatNumber(stats.myActiveEventsCount) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            Upcoming or ongoing events.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>My events revenue</CardDescription>
            <CardTitle className="text-2xl">
              {stats ? formatCurrency(stats.myRevenue) : "—"}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 text-xs text-muted-foreground">
            From paid registrations on your events.
          </CardContent>
        </Card>
      </div>

      {/* CHARTS: MY EVENTS PERFORMANCE */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* My events registrations over time */}
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">
                Registrations for my events
              </CardTitle>
              <CardDescription>
                How people are signing up to your events.
              </CardDescription>
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
            {filteredRegs && filteredRegs.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={filteredRegs}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="count"
                    name="Registrations"
                    stroke="#22c55e"
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

        {/* My top events */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">My top events</CardTitle>
            <CardDescription>
              Events you created with the most registrations.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-64">
            {myTopEvents && myTopEvents.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={myTopEvents}>
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
                  <Bar
                    dataKey="registrations"
                    name="Registrations"
                    fill="#6366f1"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-xs text-muted-foreground">
                You don&apos;t have event registrations yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* UPCOMING / PAST REGISTRATIONS WITH PAGINATION */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Upcoming */}
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Upcoming events</CardTitle>
              <CardDescription>
                Events you&apos;re registered for.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {totalUpcoming > 0 && (
                <span>
                  Page {currentUpcomingPage} of {totalUpcomingPages}
                </span>
              )}
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={handlePrevUpcoming}
                  disabled={currentUpcomingPage <= 1}
                >
                  ‹
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={handleNextUpcoming}
                  disabled={currentUpcomingPage >= totalUpcomingPages}
                >
                  ›
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingPageItems && upcomingPageItems.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcomingPageItems.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.eventTitle}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.startTime
                            ? new Date(r.startTime).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs">x{r.quantity}</TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(r.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                You don&apos;t have upcoming registrations yet.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Past */}
        <Card>
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-base">Past events</CardTitle>
              <CardDescription>Events you already attended.</CardDescription>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              {totalPast > 0 && (
                <span>
                  Page {currentPastPage} of {totalPastPages}
                </span>
              )}
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={handlePrevPast}
                  disabled={currentPastPage <= 1}
                >
                  ‹
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-7 w-7"
                  onClick={handleNextPast}
                  disabled={currentPastPage >= totalPastPages}
                >
                  ›
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {pastPageItems && pastPageItems.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Event</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Tickets</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pastPageItems.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="font-medium">
                          {r.eventTitle}
                        </TableCell>
                        <TableCell className="text-xs">
                          {r.startTime
                            ? new Date(r.startTime).toLocaleString()
                            : "—"}
                        </TableCell>
                        <TableCell className="text-xs">x{r.quantity}</TableCell>
                        <TableCell className="text-xs">
                          {formatCurrency(r.totalAmount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                No past events yet.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* RECENT ACTIVITY WITH PAGINATION */}
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-base">My recent activity</CardTitle>
            <CardDescription>
              Events you created and registrations you made.
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
                onClick={handlePrevActivity}
                disabled={currentActivityPage <= 1}
              >
                ‹
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-7 w-7"
                onClick={handleNextActivity}
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
                    <p className="font-medium text-foreground">{item.label}</p>
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
              No activity yet. Create an event or register for one to get
              started.
            </p>
          )}
        </CardContent>
      </Card>

      {isLoading && (
        <p className="text-xs text-muted-foreground">Loading dashboard...</p>
      )}
    </div>
  );
}
