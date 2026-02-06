// src/pages/Auth/Login.jsx
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { loginUser } from "../../features/auth/authSlice";
import { useToast } from "@/components/ui/use-toast";
import { CalendarClock, Sparkles } from "lucide-react";
import { useEffect } from "react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const formSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

const Login = () => {
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    resolver: zodResolver(formSchema),
  });

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { isLoading } = useSelector((state) => state.auth);
  const { toast } = useToast();

  useEffect(() => {
    const oauth = params.get("oauth");
    const provider = params.get("provider");
    if (!oauth) return;

    if (oauth === "cancelled") {
      toast({
        title: "Google sign-in cancelled",
        description: "No worries — you can try again anytime.",
      });
    } else if (oauth === "expired") {
      toast({
        variant: "destructive",
        title: "Sign-in expired",
        description: "Please try signing in with Google again.",
      });
    } else if (oauth === "failed") {
      toast({
        variant: "destructive",
        title: "Google sign-in failed",
        description:
          "Please try again. If it keeps happening, contact support.",
      });
    } else if (provider) {
      toast({
        variant: "destructive",
        title: "Sign-in failed",
        description: "Please try again.",
      });
    }
  }, [params, toast]);

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/api/auth/oauth/google/start`;
  };

  const onSubmit = (data) => {
    dispatch(loginUser({ email: data.email, password: data.password }))
      .unwrap()
      .then((payload) => {
        const role = payload.role;

        toast({
          title: "Welcome back 👋",
          description: "You’re now logged in to Eventory.",
        });

        if (role === "admin") {
          navigate("/admin/dashboard");
        } else if (role === "attendee") {
          navigate("/attendee/dashboard");
        } else {
          navigate("/events");
        }
      })
      .catch((err) => {
        toast({
          variant: "destructive",
          title: "Login failed",
          description: err || "Invalid credentials or server error.",
        });
      });
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center bg-gradient-to-b from-background via-background to-muted/40 px-4">
      <div className="mx-auto grid w-full max-w-5xl gap-10 py-10 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] items-center">
        {/* Left: hero copy */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs font-medium text-muted-foreground backdrop-blur">
            <Sparkles className="h-3 w-3 text-primary" />
            <span>Eventory · Event Management Studio</span>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight">
              Welcome back to Eventory
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              Log in to manage your events, track registrations, and keep your
              attendees in the loop — all in one dashboard.
            </p>
          </div>

          <ul className="grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 max-w-lg">
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] text-primary">
                <CalendarClock className="h-3 w-3" />
              </span>
              <span>Real-time insights on upcoming and past events.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] text-primary">
                ✓
              </span>
              <span>Centralized control over tickets & registrations.</span>
            </li>
          </ul>
        </div>

        {/* Right: auth card */}
        <div className="relative max-w-sm w-full mx-auto">
          <div className="absolute inset-0 -z-10 rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent blur-2xl" />
          <div className="relative w-full rounded-2xl border bg-card px-6 py-7 shadow-sm dark:shadow-md overflow-hidden">
            {/* subtle grid overlay */}
            <div
              className="pointer-events-none absolute inset-0 opacity-[0.16]"
              style={{
                backgroundImage: `
                  linear-gradient(to right, color-mix(in srgb, var(--border) 40%, transparent) 1px, transparent 1px),
                  linear-gradient(to bottom, color-mix(in srgb, var(--border) 40%, transparent) 1px, transparent 1px)
                `,
                backgroundSize: "18px 18px",
              }}
            />

            <div className="relative flex flex-col items-center">
              <p className="mt-1 text-lg font-semibold tracking-tight">
                Log in to your account
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Continue to access your event workspace.
              </p>

              <Button
                className="mt-6 w-full gap-3"
                type="button"
                variant="outline"
                onClick={handleGoogleLogin}
              >
                <GoogleLogo />
                Continue with Google
              </Button>

              <div className="my-6 w-full flex items-center justify-center overflow-hidden">
                <Separator />
                <span className="text-xs px-2 text-muted-foreground">OR</span>
                <Separator />
              </div>

              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="w-full space-y-4"
                >
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type="email"
                            placeholder="you@example.com"
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="••••••••"
                            className="w-full"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    className="mt-2 w-full"
                    disabled={isLoading}
                  >
                    {isLoading ? "Logging in..." : "Log in"}
                  </Button>
                </form>
              </Form>

              <p className="mt-5 text-xs text-center text-muted-foreground">
                Don&apos;t have an account yet?
                <Link
                  to="/signup"
                  className="ml-1 font-medium text-primary hover:underline"
                >
                  Create one for free
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const GoogleLogo = () => (
  <svg
    width="1.2em"
    height="1.2em"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="inline-block shrink-0 align-sub text-inherit"
  >
    <g clipPath="url(#clip0)">
      <path
        d="M15.6823 8.18368C15.6823 7.63986 15.6382 7.0931 15.5442 6.55811H7.99829V9.63876H12.3194C12.1401 10.6323 11.564 11.5113 10.7203 12.0698V14.0687H13.2983C14.8122 12.6753 15.6823 10.6176 15.6823 8.18368Z"
        fill="#4285F4"
      ></path>
      <path
        d="M7.99812 16C10.1558 16 11.9753 15.2915 13.3011 14.0687L10.7231 12.0698C10.0058 12.5578 9.07988 12.8341 8.00106 12.8341C5.91398 12.8341 4.14436 11.426 3.50942 9.53296H0.849121V11.5936C2.2072 14.295 4.97332 16 7.99812 16Z"
        fill="#34A853"
      ></path>
      <path
        d="M3.50665 9.53295C3.17154 8.53938 3.17154 7.4635 3.50665 6.46993V4.4093H0.849292C-0.285376 6.66982 -0.285376 9.33306 0.849292 11.5936L3.50665 9.53295Z"
        fill="#FBBC04"
      ></path>
      <path
        d="M7.99812 3.16589C9.13867 3.14825 10.241 3.57743 11.067 4.36523L13.3511 2.0812C11.9048 0.723121 9.98526 -0.0235266 7.99812 -1.02057e-05C4.97332 -1.02057e-05 2.2072 1.70493 0.849121 4.40932L3.50648 6.46995C4.13848 4.57394 5.91104 3.16589 7.99812 3.16589Z"
        fill="#EA4335"
      ></path>
    </g>
    <defs>
      <clipPath id="clip0">
        <rect width="15.6825" height="16" fill="white"></rect>
      </clipPath>
    </defs>
  </svg>
);

export default Login;
