// src/components/layout/Navbar.jsx
import { useSelector } from "react-redux";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon, TicketIcon } from "lucide-react";

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

function Navbar() {
  const user = useSelector((s) => s.auth.user);
  const location = useLocation();

  const isActive = (path) =>
    location.pathname === path
      ? "text-primary"
      : "text-muted-foreground hover:text-foreground";

  return (
    <nav className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TicketIcon className="h-4 w-4" />
          </span>
          <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold tracking-tight">
              Eventory
            </span>
            <span className="text-[11px] text-muted-foreground">
              Event Management System
            </span>
          </div>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-3 sm:gap-4">
          {
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                Log in
              </Link>
              <Button
                asChild
                size="sm"
                className="rounded-full text-xs sm:text-sm px-3 sm:px-4"
              >
                <Link to="/signup">Sign up</Link>
              </Button>
            </div>
          }

          {/* Theme toggle */}
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
