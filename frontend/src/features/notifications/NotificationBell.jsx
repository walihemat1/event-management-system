// src/features/notifications/NotificationBell.jsx
import { useSelector, useDispatch } from "react-redux";
import { Bell, Check, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import {
  selectNotifications,
  selectUnreadCount,
  markNotificationRead,
  deleteNotification,
} from "./notificationsSlice";

export function NotificationBell() {
  const dispatch = useDispatch();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const handleMarkRead = (id) => dispatch(markNotificationRead(id));
  const handleDelete = (id) => dispatch(deleteNotification(id));

  const latest = notifications.slice(0, 10);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-full border border-border bg-background/70 backdrop-blur"
        >
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 max-h-96 overflow-y-auto"
      >
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="text-xs text-muted-foreground">
              {unreadCount} unread
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {latest.length === 0 ? (
          <div className="px-3 py-4 text-xs text-muted-foreground">
            You don’t have any notifications yet.
          </div>
        ) : (
          latest.map((n) => (
            <div
              key={n._id}
              className={`group flex items-start gap-3 px-3 py-2 text-xs rounded-md transition-colors border-l-2 ${
                n.isRead
                  ? "border-transparent hover:bg-muted/40"
                  : "border-primary bg-muted/30 dark:bg-muted/20 hover:bg-muted/50"
              }`}
            >
              {/* Dot indicator */}
              <div
                className={`mt-1 h-2 w-2 rounded-full ${
                  n.isRead ? "bg-muted-foreground/40" : "bg-primary"
                }`}
              />

              {/* Content */}
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`${
                      n.isRead ? "font-medium" : "font-semibold text-foreground"
                    }`}
                  >
                    {n.title}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {n.createdAt ? new Date(n.createdAt).toLocaleString() : ""}
                  </span>
                </div>

                <p
                  className={`mt-0.5 ${
                    n.isRead ? "text-muted-foreground" : "text-foreground/80"
                  }`}
                >
                  {n.message}
                </p>

                <div className="mt-1 flex gap-3">
                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n._id)}
                      className="inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                    >
                      <Check className="h-3 w-3" /> Mark read
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(n._id)}
                    className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
