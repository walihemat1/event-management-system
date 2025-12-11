// src/pages/Unauthorized.jsx
import { useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, ArrowLeft, Home } from "lucide-react";

export default function Unauthorized() {
  const location = useLocation();
  const navigate = useNavigate();

  // If you redirect like: navigate("/unauthorized", { state: { from: location } })
  // we'll use that; otherwise we just show the current URL.
  const fromLocation = location.state?.from;
  const attemptedPath =
    (fromLocation?.pathname || location.pathname) +
    (fromLocation?.search || location.search || "");

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-lg border-border/80 bg-card/95 backdrop-blur-sm shadow-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-semibold tracking-tight">
            Unauthorized
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            You don&apos;t have permission to view this page or perform this
            action.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-md border border-border/70 bg-muted/40 px-3 py-2 text-xs sm:text-sm">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
              Attempted URL
            </p>
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="border-primary/30 bg-background/60 font-mono text-[11px] sm:text-xs px-2 py-0.5 truncate max-w-full"
                title={attemptedPath}
              >
                {attemptedPath || "/"}
              </Badge>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-muted-foreground">
            If you believe this is a mistake, contact the administrator or try
            logging in with an account that has the required permissions.
          </p>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="inline-flex items-center gap-1"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Go back
            </Button>
            <Button
              size="sm"
              className="inline-flex items-center gap-1"
              onClick={() => navigate("/")}
            >
              <Home className="h-3.5 w-3.5" />
              Go to home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
