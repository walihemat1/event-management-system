// src/components/AdminRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ProtectedRoute from "../../pages/ProtectedRoute";
import AppLayout from "../../pages/AppLayout";
import AdminDashboard from "./AdminDashboard"; // adjust path if needed
import CategoryPage from "../category/CategoryPage";
import AdminUserManagement from "./AdminUserManagement";
// import EventsList from "../pages/EventsList";

export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route element={<AppLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="categories" element={<CategoryPage />} />
          <Route path="users" element={<AdminUserManagement />} />

          {/* shared page available under /admin/events */}
          {/* <Route path="events" element={<EventsList />} /> */}

          {/* default /admin -> /admin/dashboard */}
          <Route path="*" element={<Navigate to="dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
