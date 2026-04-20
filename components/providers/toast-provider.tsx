"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export type ToastTone = "neutral" | "success" | "warning" | "danger";

interface ToastRecord {
  id: string;
  message: string;
  tone: ToastTone;
}

interface ShowToastInput {
  message: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastContextValue {
  showToast: (input: ShowToastInput) => void;
  dismissToast: (id: string) => void;
}

const DEFAULT_DURATION_MS = 3000;
const ToastContext = createContext<ToastContextValue | null>(null);

function toneLabel(tone: ToastTone): string {
  if (tone === "success") {
    return "Success";
  }

  if (tone === "warning") {
    return "Warning";
  }

  if (tone === "danger") {
    return "Error";
  }

  return "Notice";
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const timeoutMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );

  const dismissToast = useCallback((id: string) => {
    const timeout = timeoutMapRef.current.get(id);

    if (timeout) {
      clearTimeout(timeout);
      timeoutMapRef.current.delete(id);
    }

    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback(
    ({ message, tone = "neutral", durationMs = DEFAULT_DURATION_MS }: ShowToastInput) => {
      const trimmed = message.trim();

      if (!trimmed) {
        return;
      }

      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      setToasts((current) => [...current, { id, message: trimmed, tone }]);

      const timeout = setTimeout(() => {
        dismissToast(id);
      }, durationMs);

      timeoutMapRef.current.set(id, timeout);
    },
    [dismissToast],
  );

  useEffect(() => {
    const timeoutMap = timeoutMapRef.current;

    return () => {
      for (const timeout of timeoutMap.values()) {
        clearTimeout(timeout);
      }

      timeoutMap.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      showToast,
      dismissToast,
    }),
    [dismissToast, showToast],
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex justify-center px-4 sm:justify-end sm:px-6">
        <div className="flex w-full max-w-md flex-col gap-3">
          {toasts.map((toast) => (
            <div
              key={toast.id}
              role={toast.tone === "danger" ? "alert" : "status"}
              className={cn(
                "pointer-events-auto rounded-[var(--radius-md)] border px-4 py-3 shadow-[0_24px_60px_rgba(0,0,0,0.32)] backdrop-blur-xl transition",
                toast.tone === "neutral" &&
                  "border-[var(--line)] bg-[rgba(13,17,23,0.94)] text-[var(--text)]",
                toast.tone === "success" &&
                  "border-[rgba(199,255,125,0.34)] bg-[linear-gradient(135deg,rgba(199,255,125,0.18),rgba(13,17,23,0.96))] text-[var(--text)]",
                toast.tone === "warning" &&
                  "border-[rgba(255,143,63,0.34)] bg-[linear-gradient(135deg,rgba(255,143,63,0.2),rgba(13,17,23,0.96))] text-[var(--text)]",
                toast.tone === "danger" &&
                  "border-[rgba(255,141,136,0.38)] bg-[linear-gradient(135deg,rgba(255,141,136,0.2),rgba(13,17,23,0.96))] text-[var(--text)]",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div
                    className={cn(
                      "text-[11px] font-bold uppercase tracking-[0.2em]",
                      toast.tone === "neutral" && "text-[var(--text-subtle)]",
                      toast.tone === "success" && "text-[var(--signal)]",
                      toast.tone === "warning" && "text-[var(--accent)]",
                      toast.tone === "danger" && "text-[var(--danger)]",
                    )}
                  >
                    {toneLabel(toast.tone)}
                  </div>
                  <div className="mt-1 text-sm leading-6 text-[var(--text)]">
                    {toast.message}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => dismissToast(toast.id)}
                  className="rounded-full border border-white/10 px-2 py-1 text-xs font-bold uppercase tracking-[0.16em] text-[var(--text-subtle)] transition hover:border-white/20 hover:text-[var(--text)]"
                >
                  Close
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside ToastProvider");
  }

  return context;
}
