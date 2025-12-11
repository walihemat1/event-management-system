// src/components/ui/use-toast.js
import { useCallback } from "react";

// simple global listeners array
let listeners = [];

// subscribe function used by Toaster
export function subscribeToToasts(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

// main toast function (called from components)
export function toast(options) {
  const toastOptions = {
    id: Date.now() + Math.random(),
    title: options.title || "",
    description: options.description || "",
    variant: options.variant || "default", // "default" | "destructive"
    duration: typeof options.duration === "number" ? options.duration : 3000,
  };

  listeners.forEach((listener) => listener(toastOptions));
}

// hook used in components
export function useToast() {
  // this wrapper is just to keep the API similar to shadcn's
  const triggerToast = useCallback((options) => {
    toast(options);
  }, []);

  return { toast: triggerToast };
}
