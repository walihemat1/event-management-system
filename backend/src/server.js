import express from "express";
import cors from "cors";
import env from "dotenv";
import http from "http";
import cookieParser from "cookie-parser";

import connectDB from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
import eventRoutes from "./routes/event.routes.js";
import userRoutes from "./routes/user.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import attendeeRoutes from "./routes/attendee.routes.js";
import ticketRoutes from "./routes/ticket.routes.js";
import eventRegistraionRoutes from "./routes/eventRegistration.routes.js";
import categoryRoutes from "./routes/category.routes.js";
import feedbackRoutes from "./routes/feedback.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminUserRoutes from "./routes/adminUser.routes.js";
import { initSocket } from "./socket/socket.js";

env.config();

const app = express();

// middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//routes
app.use("/api/auth", authRoutes); // authentication (login, signup, logout)
app.use("/api/users", userRoutes); // user management (update profile, update password)
app.use("/api/admin", adminRoutes);
app.use("/api/attendee", attendeeRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/events", eventRoutes); // event management
app.use("/api/events", ticketRoutes); /*/api/events/:eventId/tickets*/ // tickets
app.use("/api", eventRegistraionRoutes); // registrations
app.use("/api/event", feedbackRoutes); // feedback
// chats & messages
// app.use("/api");
app.use("/api/notifications", notificationRoutes); // notifications
app.use("/api/categories", categoryRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `The requested path ${req.path} was not found`,
  });
});

const expressServer = http.createServer(app);
const io = initSocket(expressServer);

export default expressServer;

// connect to Database
connectDB();
