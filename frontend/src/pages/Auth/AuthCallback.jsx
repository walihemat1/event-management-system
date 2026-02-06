import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { bootstrapAuth } from "@/features/auth/authSlice";

export default function AuthCallback() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const { isLoading, isAuthenticated, user, role, error } = useSelector(
    (s) => s.auth
  );

  useEffect(() => {
    // After OAuth redirect, we need to fetch the session from the backend cookie.
    dispatch(bootstrapAuth());
  }, [dispatch]);

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) return;

    const next = params.get("next");
    if (next) {
      navigate(next, { replace: true });
      return;
    }

    const userRole = role || user?.role;
    if (userRole === "admin") navigate("/admin/dashboard", { replace: true });
    else if (userRole === "attendee")
      navigate("/attendee/dashboard", { replace: true });
    else navigate("/events", { replace: true });
  }, [isLoading, isAuthenticated, navigate, params, role, user]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center space-y-2">
        <p className="text-lg font-semibold">Signing you in…</p>
        <p className="text-sm text-muted-foreground">
          Please wait while we finish connecting your account.
        </p>
        {error && (
          <p className="text-sm text-destructive">
            {typeof error === "string" ? error : "Authentication failed"}
          </p>
        )}
      </div>
    </div>
  );
}
