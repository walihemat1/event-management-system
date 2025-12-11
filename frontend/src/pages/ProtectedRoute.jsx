// src/pages/ProtectedRoute.jsx
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, role, isAuthenticated, isLoading } = useSelector(
    (state) => state.auth
  );

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const userRole = role || user?.role;

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (userRole === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (userRole === "attendee")
      return <Navigate to="/attendee/dashboard" replace />;
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
