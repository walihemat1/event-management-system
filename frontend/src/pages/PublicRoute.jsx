// src/pages/PublicRoute.jsx
import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

export default function PublicRoute() {
  const { isAuthenticated, isLoading, hasCheckedAuth } = useSelector(
    (state) => state.auth
  );

  if (isLoading || !hasCheckedAuth) {
    return <div>Loading...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/events" replace />;
  }

  return <Outlet />;
}
