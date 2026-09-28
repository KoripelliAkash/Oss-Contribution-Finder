/* eslint-disable react-refresh/only-export-components -- the toast context and
   its hook live next to the provider on purpose. */
import { createContext, useContext, useEffect, useRef, useState } from "react";

const ToastContext = createContext(null);

/* GitHub flash messages: neutral border, tinted background. */
const VARIANTS = {
  info: "border-border bg-canvas-subtle text-fg",
  success: "border-success-emphasis bg-success-subtle text-fg",
  error: "border-danger-emphasis bg-danger-subtle text-fg",
};

let nextId = 1;

/** Import/merge feedback for the save feature. */
export function ToastProvider({ children, timeout = 6000 }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  useEffect(() => {
    const scheduled = timers.current;
    return () => {
      scheduled.forEach((timer) => clearTimeout(timer));
      scheduled.clear();
    };
  }, []);

  function dismiss(id) {
    setToasts((current) => current.filter((toast) => toast.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }

  function push(message, variant = "info") {
    const id = nextId++;
    setToasts((current) => [...current, { id, message, variant }]);
    if (timeout > 0) {
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), timeout),
      );
    }
    return id;
  }

  return (
    <ToastContext.Provider value={{ toasts, push, dismiss }}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        role="status"
        aria-live="polite"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 rounded-lg border px-3 py-2 text-sm shadow-md ${
              VARIANTS[toast.variant] ?? VARIANTS.info
            }`}
          >
            <span>{toast.message}</span>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="shrink-0 rounded px-1 text-xs font-semibold uppercase tracking-wide opacity-70 hover:opacity-100"
              aria-label="Dismiss notification"
            >
              X
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used inside a <ToastProvider>.");
  }
  return context;
}
