"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { useAuth } from "@/components/providers/auth-provider";
import {
  Button,
  Label,
  Notice,
  Panel,
  TextInput,
} from "@/components/ui/primitives";
import { extractErrorMessage } from "@/lib/api";

type AuthMode = "login" | "signup";

const WINDOW_STORIES = [
  {
    title: "Open",
    caption: "Traits you own and others recognize.",
  },
  {
    title: "Blind",
    caption: "Strengths other people see before you do.",
  },
  {
    title: "Hidden",
    caption: "Qualities you protect or rarely show first.",
  },
  {
    title: "Unknown",
    caption: "Potential still waiting for context.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const { isReady, isAuthenticated, user, login, signup, googleLogin, logout } =
    useAuth();
  const [mode, setMode] = useState<AuthMode>("signup");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
  });

  const headline = useMemo(
    () =>
      isAuthenticated && user
        ? `Welcome back, ${user.fullName ?? user.email.split("@")[0]}.`
        : "See the version of you that other people already know.",
    [isAuthenticated, user],
  );

  const updateField = (key: keyof typeof form, value: string) => {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    if (mode === "signup" && form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      setPending(false);
      return;
    }
    try {
      if (mode === "login") {
        await login({
          email: form.email,
          password: form.password,
        });
        router.push("/dashboard");
        return;
      }

      const result = await signup({
        email: form.email,
        password: form.password,
        fullName: form.fullName || undefined,
      });

      router.push(
        `/verify?email=${encodeURIComponent(result.email)}&expires=${result.expiresInMinutes}`,
      );
    } catch (submissionError) {
      setError(extractErrorMessage(submissionError));
    } finally {
      setPending(false);
    }
  };

  const handleGoogle = async (credential: string) => {
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      await googleLogin(credential);
      router.push("/dashboard");
    } catch (googleError) {
      setError(extractErrorMessage(googleError));
    } finally {
      setPending(false);
    }
  };

  const handleLogout = async () => {
    setPending(true);

    try {
      await logout();
      setMessage(
        "Signed out. Come back when you want another reflection round.",
      );
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1400px] flex-col px-6 py-8 md:px-10">
        <header className="reveal flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-6">
          <Link href="/" className="space-y-1">
            <div className="section-kicker">MirrorMates</div>
            <div className="font-[var(--font-display)] text-2xl tracking-[-0.04em]">
              Human feedback, designed to feel safe.
            </div>
          </Link>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <Button tone="ghost">Dashboard</Button>
                </Link>
                <Button tone="danger" onClick={handleLogout} disabled={pending}>
                  Sign out
                </Button>
              </>
            ) : (
              <>
                <Link href="#auth">
                  <Button>Start reflecting</Button>
                </Link>
              </>
            )}
          </div>
        </header>

        <section className="grid flex-1 gap-8 py-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-8">
            <div className="reveal reveal-2 space-y-6">
              <h1 className="max-w-5xl font-[var(--font-display)] text-6xl leading-[0.9] tracking-[-0.06em] text-balance md:text-8xl">
                {headline}
              </h1>
              <p className="max-w-2xl text-xl leading-9 text-[var(--text-muted)]">
                MirrorMates turns a classic self-awareness exercise into
                something shareable: pick your own traits, invite other people,
                and watch the four windows fill in with patterns you can
                actually feel.
              </p>
            </div>

            <div className="reveal reveal-3 grid gap-4 sm:grid-cols-2">
              {WINDOW_STORIES.map((window, index) => (
                <Panel
                  key={window.title}
                  className={
                    index % 2 === 0
                      ? "border-[rgba(255,143,63,0.18)]"
                      : "border-[rgba(149,215,255,0.18)]"
                  }
                >
                  <div className="space-y-3">
                    <div className="section-kicker">{window.title}</div>
                    <h2 className="font-[var(--font-display)] text-3xl tracking-[-0.04em]">
                      {window.title} Window
                    </h2>
                    <p className="text-base leading-7 text-[var(--text-muted)]">
                      {window.caption}
                    </p>
                  </div>
                </Panel>
              ))}
            </div>
          </div>

          <Panel id="auth" paper className="reveal reveal-3 relative">
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,143,63,0.32),transparent_65%)]" />
            <div className="relative space-y-4 sm:space-y-6">
              <div className="flex items-center gap-2 rounded-full bg-[rgba(25,20,16,0.08)] p-1.5 sm:p-1">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex-1 rounded-full px-4 py-3 sm:px-3 sm:py-3 text-sm sm:text-sm font-bold transition whitespace-nowrap cursor-pointer touch-manipulation ${
                    mode === "login"
                      ? "bg-zinc-900 text-white shadow-lg"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`flex-1 rounded-full px-4 py-3 sm:px-3 sm:py-3 text-sm sm:text-sm font-bold transition whitespace-nowrap cursor-pointer touch-manipulation ${
                    mode === "signup"
                      ? "bg-zinc-900 text-white shadow-lg"
                      : "text-zinc-600 hover:text-zinc-400"
                  }`}
                >
                  Create account
                </button>
              </div>

              <div className="space-y-3">
                <h2 className="font-[var(--font-display)] text-5xl leading-[0.95] tracking-[-0.05em]">
                  {mode === "login"
                    ? "Step back into your reflection room."
                    : "Start with a code in your inbox, not a cold form."}
                </h2>
                <p className="text-lg leading-8 text-[rgba(25,20,16,0.72)]">
                  {mode === "login"
                    ? "Use your password or Google to continue."
                    : "Sign up with email and we'll send a 6-digit verification code before creating your account."}
                </p>
              </div>

              {message ? <Notice tone="success">{message}</Notice> : null}
              {error ? <Notice tone="danger">{error}</Notice> : null}
              {!isReady ? (
                <Notice tone="neutral">Checking your current session...</Notice>
              ) : null}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {mode === "signup" ? (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full name</Label>
                    <TextInput
                      id="fullName"
                      value={form.fullName}
                      onChange={(event) =>
                        updateField("fullName", event.target.value)
                      }
                      placeholder="What should your friends call you?"
                    />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <TextInput
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField("email", event.target.value)
                    }
                    placeholder="you@mirrormates.com"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Password
                    {mode === "signup" ? " (8+ characters)" : null}
                  </Label>
                  <TextInput
                    id="password"
                    type="password"
                    value={form.password}
                    onChange={(event) =>
                      updateField("password", event.target.value)
                    }
                    placeholder="Keep it memorable"
                    required
                  />
                </div>

                <Button className="w-full" disabled={pending}>
                  {pending
                    ? "Working on it..."
                    : mode === "login"
                      ? "Sign in"
                      : "Send verification code"}
                </Button>
              </form>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm uppercase tracking-[0.18em] text-[rgba(25,20,16,0.45)]">
                  <span className="h-px flex-1 bg-[rgba(25,20,16,0.14)]" />
                  <span>or continue with Google</span>
                  <span className="h-px flex-1 bg-[rgba(25,20,16,0.14)]" />
                </div>
                <GoogleSignInButton onCredential={handleGoogle} />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[rgba(25,20,16,0.68)]">
                <Link href="/forgot-password" className="font-bold underline">
                  Forgot your password?
                </Link>
                {isAuthenticated ? (
                  <Link href="/dashboard" className="font-bold underline">
                    Open dashboard
                  </Link>
                ) : null}
              </div>
            </div>
          </Panel>
        </section>
      </div>
    </main>
  );
}
