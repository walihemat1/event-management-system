// src/pages/AppLayout.jsx
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { useToast } from "@/components/ui/use-toast";

import {
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/layout/AppSidebar";

import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { logoutUser } from "../features/auth/authSlice";
import {
  fetchNotifications,
  addNotification,
} from "../features/notifications/notificationsSlice";
import { NotificationBell } from "../features/notifications/NotificationBell";
import { socket, initSocket } from "../lib/socket";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = document.documentElement;
    const stored = localStorage.getItem("theme");

    let shouldBeDark = false;

    if (stored === "dark") shouldBeDark = true;
    else if (stored === "light") shouldBeDark = false;
    else
      shouldBeDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    setIsDark(shouldBeDark);
    if (shouldBeDark) root.classList.add("dark");
    else root.classList.remove("dark");
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      const root = document.documentElement;

      if (next) {
        root.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        root.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }

      return next;
    });
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="h-9 w-9 rounded-full border border-border bg-background/70 backdrop-blur"
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}

function UserMenu() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const name =
    user?.fullName ||
    user?.username ||
    (user?.email ? user.email.split("@")[0] : null) ||
    "User";
  const email = user?.email || "";
  const initials =
    (user?.fullName && user.fullName[0]) ||
    (user?.email && user.email[0]) ||
    "U";

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      navigate("/login");
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-3 px-2 sm:px-3 rounded-full"
        >
          <Avatar className="h-8 w-8 object-cover">
            <AvatarImage
              src={user?.profilePic || ""}
              alt={name}
              className="object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {initials.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium leading-tight">{name}</span>
            {email && (
              <span className="text-xs text-muted-foreground leading-tight">
                {email}
              </span>
            )}
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">{name}</span>
            {email && (
              <span className="text-xs text-muted-foreground">{email}</span>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => navigate("/profile")}>
          Profile
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Header() {
  return (
    <header className="w-full h-16 sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="mx-auto flex h-full max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="mr-1" />
          <h1 className="text-lg sm:text-xl font-semibold tracking-tight">
            Event Management System
          </h1>
        </div>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <NotificationBell />
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

export default function AppLayout() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id) return;

    // 1) load existing notifications
    dispatch(fetchNotifications());

    // 2) socket join + listener
    initSocket(user.id);

    const handler = (notification) => {
      console.log("📩 new-notification from server:", notification);
      dispatch(addNotification(notification));
      toast({
        title: notification.title,
        description: notification.message,
      });
    };

    socket.on("new-notification", handler);

    return () => {
      socket.off("new-notification", handler);
    };
  }, [dispatch, user?.id, toast]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="min-h-[calc(100vh-4rem)] bg-background px-4 py-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
