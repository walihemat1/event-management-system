// controllers/attendee.controller.js
import Event from "../models/eventModel.js";
import Registration from "../models/eventRegistrationModel.js";
import Ticket from "../models/ticketModel.js";

export const getMyDashboard = async (req, res) => {
  try {
    const userId = req.user._id;

    // ---- REGISTRATIONS AS ATTENDEE ----
    const myRegistrations = await Registration.find({
      userId,
      status: "active",
    })
      .sort({ createdAt: -1 })
      .populate("eventId", "title startTime endTime location");

    const now = new Date();

    const upcomingRegs = myRegistrations.filter(
      (r) => r.eventId && r.eventId.startTime > now
    );
    const pastRegs = myRegistrations.filter(
      (r) => r.eventId && r.eventId.endTime < now
    );

    const totalTicketsOwned = myRegistrations.reduce(
      (sum, r) => sum + (r.quantity || 0),
      0
    );

    const totalSpent = myRegistrations
      .filter((r) => r.paymentStatus === "paid")
      .reduce((sum, r) => sum + (r.totalAmount || 0), 0);

    // ---- AS CREATOR / ORGANIZER (events I created) ----
    const myEvents = await Event.find({ organizerId: userId });
    const myEventIds = myEvents.map((e) => e._id);

    const myEventsCount = myEvents.length;
    const myActiveEventsCount = myEvents.filter(
      (e) => !e.isCancelled && ["upcoming", "ongoing"].includes(e.status)
    ).length;

    // Tickets belonging to my events
    const myTickets = await Ticket.find({ eventId: { $in: myEventIds } });

    const myTicketsSold = myTickets.reduce(
      (sum, t) => sum + (t.quantitySold || 0),
      0
    );

    // Revenue from registrations on my events
    const myEventRegistrations = await Registration.find({
      eventId: { $in: myEventIds },
      status: "active",
      paymentStatus: "paid",
    });

    const myRevenue = myEventRegistrations.reduce(
      (sum, r) => sum + (r.totalAmount || 0),
      0
    );

    // ---- My events registrations over last 30 days ----
    const start = new Date();
    start.setDate(start.getDate() - 30);

    const regsOverTimeAgg = await Registration.aggregate([
      {
        $match: {
          eventId: { $in: myEventIds },
          status: "active",
          createdAt: { $gte: start },
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

    const myRegistrationsOverTime = regsOverTimeAgg.map((r) => ({
      date: r._id,
      count: r.count,
    }));

    // ---- My top events by registrations ----
    const myTopEventsAgg = await Registration.aggregate([
      {
        $match: {
          eventId: { $in: myEventIds },
          status: "active",
        },
      },
      {
        $group: {
          _id: "$eventId",
          registrations: { $sum: 1 },
        },
      },
      { $sort: { registrations: -1 } },
      { $limit: 5 },
    ]);

    const myTopEventIds = myTopEventsAgg.map((e) => e._id);
    const myTopEventsDocs = await Event.find({
      _id: { $in: myTopEventIds },
    }).select("title startTime");

    const myTopEvents = myTopEventsAgg.map((t) => {
      const ev = myTopEventsDocs.find(
        (e) => e._id.toString() === t._id.toString()
      );
      return {
        id: t._id,
        name: ev?.title || "Untitled event",
        registrations: t.registrations,
        startDate: ev?.startTime,
      };
    });

    // ---- Recent activity (as attendee + as creator) ----
    const recentEventsICreated = await Event.find({ organizerId: userId })
      .sort({ createdAt: -1 })
      .limit(10)
      .select("title createdAt");

    const recentMyRegs = myRegistrations.slice(0, 10); // already sorted desc

    const recentActivity = [
      ...recentEventsICreated.map((ev) => ({
        type: "event_created",
        createdAt: ev.createdAt,
        label: `You created event: ${ev.title}`,
      })),
      ...recentMyRegs.map((r) => ({
        type: "registration_made",
        createdAt: r.createdAt,
        label: `You registered for: ${r.eventId?.title || "Event"} (x${
          r.quantity || 1
        })`,
      })),
    ]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 30);

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          upcomingRegistrationsCount: upcomingRegs.length,
          pastRegistrationsCount: pastRegs.length,
          totalTicketsOwned,
          totalSpent,
          myEventsCount,
          myActiveEventsCount,
          myTicketsSold,
          myRevenue,
        },
        // attendee side
        upcomingRegistrations: upcomingRegs.slice(0, 10).map((r) => ({
          id: r._id,
          eventTitle: r.eventId?.title || "Event",
          startTime: r.eventId?.startTime,
          quantity: r.quantity,
          totalAmount: r.totalAmount,
          paymentStatus: r.paymentStatus,
        })),
        pastRegistrations: pastRegs.slice(0, 10).map((r) => ({
          id: r._id,
          eventTitle: r.eventId?.title || "Event",
          startTime: r.eventId?.startTime,
          quantity: r.quantity,
          totalAmount: r.totalAmount,
          paymentStatus: r.paymentStatus,
        })),
        // creator side
        myRegistrationsOverTime,
        myTopEvents,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Error in getMyDashboard controller:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};
