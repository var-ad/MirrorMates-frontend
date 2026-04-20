"use client";

import { useEffect, useRef, useState } from "react";
import { GOOGLE_CLIENT_ID } from "@/lib/config";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            element: HTMLElement,
            options: {
              theme?: "outline" | "filled_black" | "filled_blue";
              size?: "large" | "medium" | "small";
              shape?: "rectangular" | "pill" | "circle" | "square";
              text?: "signin_with" | "signup_with" | "continue_with";
              width?: string | number;
              logo_alignment?: "left" | "center";
            },
          ) => void;
        };
      };
    };
  }
}

const GOOGLE_IDENTITY_SCRIPT_ID = "google-identity-script";
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

function ensureGoogleScript() {
  const existing = document.getElementById(GOOGLE_IDENTITY_SCRIPT_ID);

  if (existing) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = GOOGLE_IDENTITY_SCRIPT_ID;
    script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("Unable to load Google Identity Services"));
    document.head.appendChild(script);
  });
}

export function GoogleSignInButton({
  className,
  onCredential,
}: {
  className?: string;
  onCredential: (credential: string) => Promise<void> | void;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const onCredentialRef = useRef(onCredential);
  const lastRenderedWidthRef = useRef<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  useEffect(() => {
    onCredentialRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    let waitInterval: ReturnType<typeof setInterval> | null = null;
    let resizeObserver: ResizeObserver | null = null;

    const renderGoogleButton = () => {
      if (!window.google?.accounts?.id || !containerRef.current) {
        return;
      }

      const containerWidth = Math.floor(
        containerRef.current.clientWidth || 320,
      );
      const buttonWidth = Math.max(220, Math.min(400, containerWidth));

      if (
        lastRenderedWidthRef.current === buttonWidth &&
        containerRef.current.childElementCount > 0
      ) {
        return;
      }

      lastRenderedWidthRef.current = buttonWidth;
      containerRef.current.innerHTML = "";
      window.google.accounts.id.renderButton(containerRef.current, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text: "continue_with",
        width: buttonWidth,
        logo_alignment: "left",
      });
    };

    const waitForGoogle = () =>
      new Promise<void>((resolve, reject) => {
        const start = Date.now();
        waitInterval = setInterval(() => {
          if (cancelled) {
            if (waitInterval) {
              clearInterval(waitInterval);
              waitInterval = null;
            }
            reject(new Error("cancelled"));
            return;
          }
          if (window.google?.accounts?.id) {
            if (waitInterval) {
              clearInterval(waitInterval);
              waitInterval = null;
            }
            resolve();
          } else if (Date.now() - start > 5000) {
            if (waitInterval) {
              clearInterval(waitInterval);
              waitInterval = null;
            }
            reject(new Error("Google Identity timed out"));
          }
        }, 100);
      });

    const init = async () => {
      if (!GOOGLE_CLIENT_ID) {
        setStatus("error");
        return;
      }

      setStatus("loading");

      try {
        await ensureGoogleScript();
        await waitForGoogle();
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
        return;
      }

      if (cancelled || !window.google?.accounts?.id || !containerRef.current) {
        return;
      }

      // Initialize on each mount so the active callback always matches this component instance.
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: async ({ credential }) => {
          await onCredentialRef.current(credential);
        },
      });

      renderGoogleButton();

      if (
        !cancelled &&
        typeof ResizeObserver !== "undefined" &&
        containerRef.current
      ) {
        resizeObserver = new ResizeObserver(() => {
          if (!cancelled) {
            renderGoogleButton();
          }
        });
        resizeObserver.observe(containerRef.current);
      }

      if (!cancelled) {
        setStatus("ready");
      }
    };

    void init();

    return () => {
      cancelled = true;
      lastRenderedWidthRef.current = null;
      if (waitInterval) {
        clearInterval(waitInterval);
      }
      resizeObserver?.disconnect();
    };
  }, []);

  if (!GOOGLE_CLIENT_ID) {
    return (
      <div
        className={cn(
          "rounded-[var(--radius-md)] border border-[var(--line)] px-4 py-3 text-sm text-[var(--text-subtle)]",
          className,
        )}
      >
        Google sign-in is not configured for this frontend yet.
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        ref={containerRef}
        className="flex min-h-12 w-full items-center justify-center overflow-visible"
        style={{ WebkitOverflowScrolling: "touch" }}
      />
      {status === "error" ? (
        <p className="mt-2 text-sm text-[var(--danger)]">
          Google sign-in could not load on this device.
        </p>
      ) : null}
    </div>
  );
}
