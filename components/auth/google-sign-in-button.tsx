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

function ensureGoogleScript() {
  const existing = document.getElementById("google-identity-script");

  if (existing) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.id = "google-identity-script";
    script.src = "https://accounts.google.com/gsi/client";
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
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle",
  );

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      if (!GOOGLE_CLIENT_ID) {
        setStatus("error");
        return;
      }

      setStatus("loading");

      try {
        await ensureGoogleScript();

        const waitForGoogle = () => {
          return new Promise<void>((resolve, reject) => {
            const start = Date.now();
            const interval = setInterval(() => {
              if (window.google?.accounts?.id) {
                clearInterval(interval);
                resolve();
              } else if (Date.now() - start > 5000) {
                clearInterval(interval);
                reject(new Error("Google Identity timed out"));
              }
            }, 100);
          });
        };

        await waitForGoogle();

        if (cancelled || !window.google || !containerRef.current) {
          return;
        }

        containerRef.current.innerHTML = "";

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: async ({ credential }) => {
            await onCredential(credential);
          },
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          theme: "filled_black",
          size: "large",
          shape: "pill",
          text: "continue_with",
          width: "100%",
          logo_alignment: "left",
        });

        setStatus("ready");
      } catch {
        if (!cancelled) {
          setStatus("error");
        }
      }
    };

    void init();

    return () => {
      cancelled = true;
    };
  }, [onCredential]);

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
