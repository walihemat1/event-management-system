// controllers/admin.controller.js
import User from "../models/userModel.js";
import Event from "../models/eventModel.js";
import Registration from "../models/eventRegistrationModel.js";
import Category from "../models/categoryModel.js"; // adjust path if needed
import Ticket from "../models/ticketModel.js";

export const getAdminDashboard = async (req, res) => {
  try {
    // ---- BASIC COUNTS ----
    const [totalUsers, totalEvents, activeEvents, totalRegistrations] =
      await Promise.all([
        User.countDocuments(),
        Event.countDocuments(),
        Event.countDocuments({ status: { $in: ["upcoming", "ongoing"] } }),
        Registration.countDocuments({ status: "active" }),
      ]);

    // ---- REGISTRATIONS OVER LAST 30 DAYS ----
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - 30);

    const registrationsLast30 = await Registration.aggregate([
      {
        $match: {
          createdAt: { $gte: start },
          status: "active",
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const registrationsOverTime = registrationsLast30.map((r) => ({
      date: r._id,
      count: r.count,
    }));

    // ---- TICKET SUMMARY & REVENUE ----
    const ticketSummaryAgg = await Ticket.aggregate([
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          totalCapacity: { $sum: "$quantityAvailable" },
          totalTicketsSold: { $sum: "$quantitySold" },
        },
      },
    ]);

    const ticketSummaryBase = ticketSummaryAgg[0] || {
      totalTickets: 0,
      totalCapacity: 0,
      totalTicketsSold: 0,
    };

    const revenueAgg = await Registration.aggregate([
      {
        $match: {
          status: "active",
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalAmount" },
          paidRegistrations: { $sum: 1 },
        },
      },
    ]);

    const revenueBase = revenueAgg[0] || {
      totalRevenue: 0,
      paidRegistrations: 0,
    };

    const soldPercentage =
      ticketSummaryBase.totalCapacity > 0
        ? (ticketSummaryBase.totalTicketsSold /
            ticketSummaryBase.totalCapacity) *
          100
        : 0;

    const ticketSummary = {
      totalTickets: ticketSummaryBase.totalTickets,
      totalCapacity: ticketSummaryBase.totalCapacity,
      totalTicketsSold: ticketSummaryBase.totalTicketsSold,
      soldPercentage,
      totalRevenue: revenueBase.totalRevenue,
      paidRegistrations: revenueBase.paidRegistrations,
    };

    // ---- TOP EVENTS BY REGISTRATIONS ----
    const topEventsAgg = await Registration.aggregate([
      { $match: { status: "active" } },
      {
        $group: {
          _id: "$eventId",
          registrations: { $sum: 1 },
        },
      },
      { $sort: { registrations: -1 } },
      { $limit: 5 },
    ]);

    const topEventIds = topEventsAgg.map((e) => e._id);

    const topEventsRaw = await Event.find({ _id: { $in: topEventIds } })
      .select("title startTime categories")
      .populate("categories", "name");

    const topEvents = topEventsAgg.map((t) => {
      const ev = topEventsRaw.find(
        (x) => x._id.toString() === t._id.toString()
      );
      return {
        id: t._id,
        name: ev?.title || "Untitled Event",
        registrations: t.registrations,
        startDate: ev?.startTime,
        categoryName: (ev?.categories && ev.categories.name) || "Uncategorized",
      };
    });

    // ---- CATEGORY BREAKDOWN (with real names) ----
    const categoryBreakdownAgg = await Event.aggregate([
      {
        $group: {
          _id: "$categories",
          count: { $sum: 1 },
        },
      },
    ]);

    const categoryIds = categoryBreakdownAgg.map((c) => c._id).filter(Boolean);

    const categoryDocs = await Category.find({
      _id: { $in: categoryIds },
    }).select("name");

    const categoryMap = new Map(
      categoryDocs.map((cat) => [cat._id.toString(), cat.name])
    );

    const categoryBreakdown = categoryBreakdownAgg.map((c) => ({
      categoryId: c._id,
      categoryName: c._id
        ? categoryMap.get(c._id.toString()) || "Unknown category"
        : "Uncategorized",
      count: c.count,
    }));

    // ---- TOP TICKETS BY QUANTITY SOLD ----
    const topTicketsAgg = await Ticket.aggregate([
      {
        $group: {
          _id: { eventId: "$eventId", name: "$name" },
          quantitySold: { $sum: "$quantitySold" },
          totalRevenue: { $sum: { $multiply: ["$price", "$quantitySold"] } },
        },
      },
      { $sort: { quantitySold: -1 } },
      { $limit: 5 },
    ]);

    const topTicketEventIds = topTicketsAgg.map((t) => t._id.eventId);

    const topTicketEvents = await Event.find({
      _id: { $in: topTicketEventIds },
    }).select("title");

    const topTickets = topTicketsAgg.map((t) => {
      const ev = topTicketEvents.find(
        (e) => e._id.toString() === t._id.eventId.toString()
      );
      return {
        eventId: t._id.eventId,
        ticketName: t._id.name,
        eventTitle: ev?.title || "Untitled Event",
        quantitySold: t.quantitySold,
        totalRevenue: t.totalRevenue,
      };
    });

    // ---- "ACTIVE" / UPCOMING EVENTS (for quick view) ----
    const pendingEvents = await Event.find({
      isCancelled: false,
      status: { $in: ["upcoming", "ongoing"] },
    })
      .sort({ startTime: 1 })
      .limit(10)
      .populate("organizerId", "email username fullName");

    const pendingEventsFormatted = pendingEvents.map((ev) => ({
      id: ev._id,
      name: ev.title,
      date: ev.startTime,
      status: ev.status,
      organizer:
        ev.organizerId?.fullName ||
        ev.organizerId?.username ||
        ev.organizerId?.email ||
        "Unknown user",
    }));

    // ---- RECENT ACTIVITY (events + registrations) ----
    const recentEvents = await Event.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .select("title createdAt");

    const recentRegs = await Registration.find()
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("userId", "email username fullName")
      .populate("eventId", "title");

    const recentActivity = [
      ...recentEvents.map((ev) => ({
        type: "event_created",
        createdAt: ev.createdAt,
        label: `Event created: ${ev.title}`,
      })),
      ...recentRegs.map((r) => ({
        type: "registration",
        createdAt: r.createdAt,
        label: `Registration: ${
          r.userId?.fullName || r.userId?.username || r.userId?.email || "User"
        } → ${r.eventId?.title || "Event"}`,
      })),
    ]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 40); // limit collection; paginate on frontend

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          totalUsers,
          totalEvents,
          activeEvents,
          totalRegistrations,
        },
        registrationsOverTime,
        ticketSummary,
        topEvents,
        topTickets,
        categoryBreakdown,
        pendingEvents: pendingEventsFormatted,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error in getAdminDashboard controller:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
