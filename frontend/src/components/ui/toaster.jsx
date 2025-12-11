// src/components/ui/toaster.jsx
import { useEffect, useState } from "react";
import { subscribeToToasts } from "./use-toast";

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsubscribe = subscribeToToasts((newToast) => {
      setToasts((prev) => [...prev, newToast]);

      if (newToast.duration !== 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== newToast.id));
        }, newToast.duration);
      }
    });

    return unsubscribe;
  }, []);

  const dismiss = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`w-80 rounded-lg border px-4 py-3 shadow-lg bg-background text-foreground ${
            t.variant === "destructive"
              ? "border-red-500 bg-red-50 text-red-900 dark:bg-red-950"
              : "border-border"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {t.title && (
                <p className="font-semibold leading-tight">{t.title}</p>
              )}
              {t.description && (
                <p className="mt-1 text-sm opacity-90">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="text-xs opacity-60 hover:opacity-100"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Toaster;
