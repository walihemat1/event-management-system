// src/components/AttendeeRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../../pages/ProtectedRoute";
import AppLayout from "../../pages/AppLayout";
import AttendeeDashboard from "./AttendeeDashboard"; // adjust path if needed
// import EventsList from "../pages/EventsList";

export default function AttendeeRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["attendee"]} />}>
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<AttendeeDashboard />} />

          {/* shared page also available under /attendee/events */}
          {/* <Route path="events" element={<EventsList />} /> */}

          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
