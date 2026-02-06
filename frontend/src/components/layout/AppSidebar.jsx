// src/components/layout/AppSidebar.jsx
import { NavLink, matchPath, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  Calendar,
  Home,
  Inbox,
  Layers,
  LogOut,
  TicketIcon,
  Users,
  X,
} from "lucide-react";

import { logoutUser } from "@/features/auth/authSlice";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

// Menu items
const adminItems = [
  { title: "Dashboard", url: "/admin/dashboard", icon: Home },
  { title: "Events", url: "/events", icon: Inbox },
  { title: "My Registrations", url: "/my-registrations", icon: TicketIcon },
  { title: "My Events", url: "/organizer-events", icon: Calendar },
  { title: "Create Event", url: "/create-event", icon: Calendar },
  { title: "Categories", url: "/admin/categories", icon: Layers },
  { title: "Users", url: "/admin/users", icon: Users },
];

const attendeeItems = [
  { title: "Dashboard", url: "/attendee/dashboard", icon: Home },
  { title: "Events", url: "/events", icon: Inbox },
  { title: "My Registrations", url: "/my-registrations", icon: TicketIcon },
  { title: "My Events", url: "/organizer-events", icon: Calendar },
  { title: "Create Event", url: "/create-event", icon: Calendar },
];

export function AppSidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isMobile, setOpen } = useSidebar();
  const { user } = useSelector((state) => state.auth);

  const initials =
    (user?.fullName && user.fullName[0]) ||
    (user?.email && user.email[0]) ||
    "U";

  const handleNavClick = () => {
    if (isMobile) setOpen(false);
  };

  const handleLogout = () => {
    dispatch(logoutUser()).then(() => {
      if (isMobile) setOpen(false);
      navigate("/login");
    });
  };

  const menuItems = user?.role === "admin" ? adminItems : attendeeItems;

  const isItemActive = (url) =>
    !!matchPath({ path: url, end: false }, location.pathname);

  return (
    <Sidebar className="border-r bg-sidebar-background text-sidebar-foreground">
      <SidebarContent className="flex h-full flex-col gap-2 p-3">
        {/* Brand / Logo */}
        <div className="mb-2 flex items-center gap-3 rounded-xl px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <TicketIcon className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              EMS Dashboard
            </span>
            <span className="text-xs text-muted-foreground">
              Manage your events
            </span>
          </div>
          {isMobile && (
            <div className="ml-auto justify-end flex mb-auto">
              <SidebarTrigger asChild>
                <button
                  type="button"
                  className="p-1 rounded-lg hover:bg-accent transition-colors"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Toggle sidebar</span>
                </button>
              </SidebarTrigger>
            </div>
          )}
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="px-3 text-xs uppercase tracking-wide text-muted-foreground">
            Navigation
          </SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {user &&
                menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={isItemActive(item.url)}
                      onClick={handleNavClick}
                      className={[
                        "gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                        // default (inactive)
                        "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                        // active (light)
                        "data-[active=true]:bg-primary/10 data-[active=true]:text-primary data-[active=true]:border data-[active=true]:border-primary/30",
                        // active (dark) - slightly stronger for contrast
                        "dark:data-[active=true]:bg-primary/20 dark:data-[active=true]:text-foreground dark:data-[active=true]:border-primary/40",
                      ].join(" ")}
                    >
                      <NavLink to={item.url}>
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Spacer to push footer to bottom */}
        <div className="flex-1" />

        {/* Footer: user + logout */}
        <div className="mt-2 space-y-2 border-t border-sidebar-border pt-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {initials.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-medium leading-tight">
                  {user.fullName || user.username || "User"}
                </span>
                {user.email && (
                  <span className="text-[11px] text-muted-foreground leading-tight">
                    {user.email}
                  </span>
                )}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleLogout}
            className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Logout</span>
          </button>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}
