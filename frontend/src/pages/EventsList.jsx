// src/pages/EventBrowse.jsx
import { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { getEvents } from "../features/events/eventsSlice";
import { getMyRegistrations } from "../features/registration/registrationSlice";

import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
} from "@/components/ui/pagination";

import {
  MapPin,
  Clock,
  Users,
  ArrowRight,
  CheckCircle2,
  Star,
} from "lucide-react";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function EventBrowse() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { list, isLoading } = useSelector((state) => state.events);
  const { items: registrations = [] } = useSelector(
    (state) => state.registrations
  );

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("startTimeAsc");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [onlyRegistered, setOnlyRegistered] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 9;

  useEffect(() => {
    dispatch(getEvents());
    dispatch(getMyRegistrations());
  }, [dispatch]);

  // registrations map
  const registrationsByEventId = useMemo(() => {
    const map = new Map();
    registrations.forEach((r) => {
      const evtId =
        typeof r.eventId === "object" ? r.eventId?._id?.toString() : r.eventId;
      if (!evtId) return;
      map.set(evtId, r);
    });
    return map;
  }, [registrations]);

  const isEventPast = (event) => {
    if (!event?.endTime) return false;
    return new Date(event.endTime) < new Date();
  };

  const userRegistrationForEvent = (event) => {
    if (!event?._id) return null;
    const reg = registrationsByEventId.get(event._id.toString());
    if (!reg) return null;

    if (reg.status === "cancelled") return reg;
    if (isEventPast(event)) return reg;

    return reg;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "TBA";
    const d = new Date(dateStr);
    return d.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getCardImageUrl = (event) => {
    if (event.media?.bannerUrl) return event.media.bannerUrl;

    const seed = event._id || event.title || "event";
    // deterministic random image per event from Picsum
    return `https://picsum.photos/seed/${encodeURIComponent(seed)}/600/300`;
  };

  // unique categories for filter
  const categoryOptions = useMemo(() => {
    const set = new Set();
    list.forEach((e) => {
      if (e.categories?.name) {
        set.add(e.categories.name);
      }
    });
    return Array.from(set).sort();
  }, [list]);

  // processed (filtered + sorted) list
  const processedEvents = useMemo(() => {
    let events = [...list];

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      events = events.filter((e) => e.title?.toLowerCase().includes(q));
    }

    // category filter
    if (categoryFilter !== "all") {
      events = events.filter((e) => e.categories?.name === categoryFilter);
    }

    // type filter
    if (typeFilter !== "all") {
      events = events.filter((e) => e.eventType === typeFilter);
    }

    // status filter
    if (statusFilter !== "all") {
      events = events.filter((e) => e.status === statusFilter);
    }

    // only events I registered for
    if (onlyRegistered) {
      events = events.filter((e) =>
        registrationsByEventId.has(e._id?.toString())
      );
    }

    // sorting
    events.sort((a, b) => {
      const aStart = a.startTime ? new Date(a.startTime).getTime() : 0;
      const bStart = b.startTime ? new Date(b.startTime).getTime() : 0;

      const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;

      const aRating = a.feedbackStats?.averageRating || 0;
      const bRating = b.feedbackStats?.averageRating || 0;

      const aCount = a.feedbackStats?.totalReviews || 0;
      const bCount = b.feedbackStats?.totalReviews || 0;

      switch (sortBy) {
        case "startTimeAsc":
          return aStart - bStart;
        case "startTimeDesc":
          return bStart - aStart;
        case "ratingDesc":
          if (bRating === aRating) return bCount - aCount;
          return bRating - aRating;
        case "reviewsDesc":
          if (bCount === aCount) return bRating - aRating;
          return bCount - aCount;
        case "recentlyCreated":
          return bCreated - aCreated;
        default:
          return 0;
      }
    });

    return events;
  }, [
    list,
    search,
    categoryFilter,
    typeFilter,
    statusFilter,
    onlyRegistered,
    sortBy,
    registrationsByEventId,
  ]);

  const totalPages = Math.ceil(processedEvents.length / pageSize) || 1;
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const pageData = processedEvents.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  const handleCardClick = (id) => {
    navigate(`/events/${id}`);
  };

  const handleViewDetailsClick = (e, id) => {
    e.stopPropagation();
    navigate(`/events/${id}`);
  };

  // reset to first page when filters change
  useEffect(() => {
    setPage(1);
  }, [
    search,
    categoryFilter,
    typeFilter,
    statusFilter,
    onlyRegistered,
    sortBy,
  ]);

  const getStatusBadgeVariant = (status) => {
    if (status === "ongoing") return "default";
    if (status === "cancelled") return "destructive";
    if (status === "ended") return "outline";
    return "secondary"; // upcoming or unknown
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-background">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-10 space-y-8">
        {/* Header / Hero */}
        <header className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <div className="inline-flex items-center rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
              <span className="mr-2 h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Upcoming & ongoing events
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
                Discover Events
              </h1>
              <p className="mt-2 text-sm md:text-base text-muted-foreground max-w-2xl">
                Explore curated experiences for organizers and attendees.
                Search, filter, and register in just a few clicks.
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="w-full md:w-80">
            <Input
              placeholder="Search events by title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="bg-card border-border focus-visible:ring-primary"
            />
          </div>
        </header>

        {/* Filters & Sort */}
        <section className="rounded-xl border border-border bg-card/80 backdrop-blur-sm px-4 py-3 sm:px-5 sm:py-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-[minmax(0,2fr)_minmax(0,1.4fr)] md:items-center">
            {/* Left: category / type / status */}
            <div className="flex flex-wrap gap-3">
              {/* Category filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="whitespace-nowrap text-xs text-muted-foreground">
                  Category
                </Label>
                <Select
                  value={categoryFilter}
                  onValueChange={(v) => setCategoryFilter(v)}
                >
                  <SelectTrigger className="h-8 w-full sm:w-[150px] text-xs">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="whitespace-nowrap text-xs text-muted-foreground">
                  Type
                </Label>
                <Select
                  value={typeFilter}
                  onValueChange={(v) => setTypeFilter(v)}
                >
                  <SelectTrigger className="h-8 w-full sm:w-[120px] text-xs">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="whitespace-nowrap text-xs text-muted-foreground">
                  Status
                </Label>
                <Select
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v)}
                >
                  <SelectTrigger className="h-8 w-full sm:w-[140px] text-xs">
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="upcoming">Upcoming</SelectItem>
                    <SelectItem value="ongoing">Ongoing</SelectItem>
                    <SelectItem value="ended">Ended</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right: sort & my registrations */}
            <div className="flex flex-wrap items-center gap-3 justify-between md:justify-end">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Label className="whitespace-nowrap text-xs text-muted-foreground">
                  Sort by
                </Label>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                  <SelectTrigger className="h-8 w-full sm:w-[180px] text-xs">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startTimeAsc">
                      Start date (soonest)
                    </SelectItem>
                    <SelectItem value="startTimeDesc">
                      Start date (latest)
                    </SelectItem>
                    <SelectItem value="ratingDesc">Highest rated</SelectItem>
                    <SelectItem value="reviewsDesc">Most reviewed</SelectItem>
                    <SelectItem value="recentlyCreated">
                      Recently created
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
                <Switch
                  id="only-registered"
                  checked={onlyRegistered}
                  onCheckedChange={setOnlyRegistered}
                />
                <Label
                  htmlFor="only-registered"
                  className="text-xs text-muted-foreground"
                >
                  Only my registrations
                </Label>
              </div>
            </div>
          </div>
        </section>

        {/* Skeleton Loading */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-72 w-full rounded-xl bg-muted" />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && processedEvents.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-16 space-y-4">
            <p className="text-lg font-semibold text-foreground">
              No events found
            </p>
            <p className="text-sm text-muted-foreground max-w-md">
              Try adjusting your search or filters, or check back later as new
              events are added regularly.
            </p>
          </div>
        )}

        {/* Events Grid */}
        {!isLoading && processedEvents.length > 0 && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageData.map((event) => {
                const myReg = userRegistrationForEvent(event);
                const label =
                  myReg && myReg.status === "cancelled"
                    ? "Registration cancelled"
                    : myReg && isEventPast(event)
                    ? "Past registration"
                    : myReg
                    ? "You’re registered"
                    : null;

                const isActive =
                  myReg && myReg.status !== "cancelled" && !isEventPast(event);

                const avg = event.feedbackStats?.averageRating || 0;
                const count = event.feedbackStats?.totalReviews || 0;

                const imageUrl = getCardImageUrl(event);

                return (
                  <Card
                    key={event._id}
                    onClick={() => handleCardClick(event._id)}
                    className="group flex h-full cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-card/90 backdrop-blur-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                  >
                    {/* Image with overlay badges */}
                    <div className="relative h-28 sm:h-32 w-full overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={event.title}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute left-3 top-3 flex flex-col gap-1">
                        {/* Status badge */}
                        {event.status && (
                          <Badge
                            variant={getStatusBadgeVariant(event.status)}
                            className="px-2 py-0.5 text-[10px] uppercase tracking-wide"
                          >
                            {event.status}
                          </Badge>
                        )}
                      </div>
                      {label && (
                        <div className="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/90 px-2.5 py-1 text-[10px] font-medium text-white shadow-sm">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{label}</span>
                        </div>
                      )}
                    </div>

                    {/* Top meta strip */}
                    <div className="flex items-center justify-between px-4 pt-3 text-xs text-muted-foreground">
                      <div className="inline-flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{formatDateTime(event.startTime)}</span>
                      </div>
                      {event.location && (
                        <div className="inline-flex items-center gap-1.5 max-w-[140px]">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {event.location.mode === "virtual"
                              ? "Online"
                              : event.location.address || "On-site"}
                          </span>
                        </div>
                      )}
                    </div>

                    <CardHeader className="space-y-2 pb-2">
                      <CardTitle className="text-base sm:text-lg font-semibold leading-snug text-foreground group-hover:text-primary line-clamp-2">
                        {event.title}
                      </CardTitle>

                      <CardDescription className="text-xs sm:text-sm text-muted-foreground line-clamp-3">
                        {event.description?.length > 140
                          ? `${event.description.slice(0, 140)}…`
                          : event.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {event.eventType && (
                          <Badge
                            variant="outline"
                            className="border-primary/20 bg-primary/5 text-primary px-2.5 py-0.5 text-[11px] rounded-full capitalize"
                          >
                            {event.eventType} event
                          </Badge>
                        )}

                        <Badge className="border border-accent/30 bg-accent/5 text-accent px-2.5 py-0.5 text-[11px] rounded-full">
                          {event.categories?.name || "Uncategorized"}
                        </Badge>

                        {event.capacity && (
                          <div className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
                            <Users className="h-3.5 w-3.5" />
                            <span>{event.capacity} spots</span>
                          </div>
                        )}
                      </div>

                      {/* Rating + status chips row */}
                      <div className="flex flex-wrap items-center gap-2">
                        {count > 0 && (
                          <div className="inline-flex items-center gap-2 rounded-full bg-muted/60 px-2.5 py-1 text-[11px]">
                            <div className="flex items-center gap-1">
                              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                              <span className="font-medium">
                                {avg.toFixed(1)}
                              </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground">
                              ({count} review{count !== 1 ? "s" : ""})
                            </span>
                          </div>
                        )}

                        {!label && event.status === "cancelled" && (
                          <div className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-2.5 py-1 text-[11px] text-destructive">
                            <span>Cancelled</span>
                          </div>
                        )}

                        {!label &&
                          event.status === "ended" &&
                          isEventPast(event) && (
                            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px] text-muted-foreground">
                              <span>Event ended</span>
                            </div>
                          )}
                      </div>
                    </CardContent>

                    <CardFooter className="mt-auto flex items-center justify-between px-4 pb-4 pt-0">
                      <div className="text-xs text-muted-foreground">
                        {event.organizerName && (
                          <span>Hosted by {event.organizerName}</span>
                        )}
                      </div>

                      <Button
                        size="sm"
                        className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs sm:text-sm"
                        onClick={(e) => handleViewDetailsClick(e, event._id)}
                      >
                        {isActive ? "Manage registration" : "View details"}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </section>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center pt-6">
                <Pagination>
                  <PaginationContent className="flex items-center gap-4">
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => safePage > 1 && setPage(safePage - 1)}
                        className="cursor-pointer"
                      />
                    </PaginationItem>

                    <span className="text-xs text-muted-foreground">
                      Page{" "}
                      <span className="font-semibold text-foreground">
                        {safePage}
                      </span>{" "}
                      of{" "}
                      <span className="font-semibold text-foreground">
                        {totalPages}
                      </span>
                    </span>

                    <PaginationItem>
                      <PaginationNext
                        onClick={() =>
                          safePage < totalPages && setPage(safePage + 1)
                        }
                        className="cursor-pointer"
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
