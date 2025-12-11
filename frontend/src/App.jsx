// src/App.jsx
import { Routes, Route, Navigate } from "react-router-dom";

import PublicLayout from "./pages/PublicLayout";
import AppLayout from "./pages/AppLayout";

// wrappers
import ProtectedRoute from "./pages/ProtectedRoute";
import PublicRoute from "./pages/PublicRoute";
import EventTicketsManage from "./pages/EventTicketsManage";

// public pages
import Home from "./pages/Home";
import EventsList from "./pages/EventsList";
import EventDetails from "./pages/EventDetails";
import Login from "./pages/Auth/Login";
import Signup from "./pages/Auth/Signup";

// role-based route groups
import AdminRoutes from "./features/admin/AdminRoutes";
import AttendeeRoutes from "./features/attendee/AttendeeRoutes";

// other pages
const Unauthorized = () => <>Unauthorized</>;

import Dashboard from "./pages/Dashboard/UserDashboard";
import CreateEvent from "./features/events/createEvent";
import CategoryPage from "./features/category/categoryPage";
import OrganizerEvents from "./pages/organizerEvents";
import EditEventPage from "./pages/EditEvent";
import EventRegister from "./pages/EventRegister";
import MyRegistrations from "./pages/MyRegistrations";
import OrganizerEventRegistrations from "./pages/OrganizerEventRegistrations";
import ProfilePage from "./pages/Profile";

export default function App() {
  return (
    <Routes>
      {/* ---------- PUBLIC ROUTES (ONLY WHEN LOGGED OUT) ---------- */}
      <Route element={<PublicRoute />}>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
        </Route>
      </Route>

      {/* ---------- COMMON AUTHENTICATED ROUTES (ANY ROLE) ---------- */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/events" element={<EventsList />} />
          <Route path="/events/:eventId" element={<EventDetails />} />
          <Route path="/create-event" element={<CreateEvent />} />
          <Route path="/events/:eventId/edit" element={<EditEventPage />} />
          <Route path="/organizer-events" element={<OrganizerEvents />} />
          <Route
            path="/events/:eventId/tickets"
            element={<EventTicketsManage />}
          />
          <Route path="/events/:eventId/register" element={<EventRegister />} />
          <Route path="/my-registrations" element={<MyRegistrations />} />
          <Route
            path="/events/:eventId/registrations"
            element={<OrganizerEventRegistrations />}
          />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* ---------- ADMIN AREA USING AdminRoutes ---------- */}
      <Route path="/admin/*" element={<AdminRoutes />} />

      {/* ---------- ATTENDEE AREA USING AttendeeRoutes ---------- */}
      <Route path="/attendee/*" element={<AttendeeRoutes />} />

      {/* ---------- UNAUTHORIZED & FALLBACK ---------- */}
      <Route path="/unauthorized" element={<Unauthorized />} />
      <Route path="/*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
