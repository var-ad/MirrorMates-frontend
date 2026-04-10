"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/ui/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { AdjectiveSelector } from "@/components/johari/adjective-selector";
import {
  Button,
  Label,
  Notice,
  Panel,
  SectionHeading,
  SelectInput,
  TextInput,
} from "@/components/ui/primitives";
import {
  createSession,
  extractErrorMessage,
  listAdjectives,
  listMySessions,
} from "@/lib/api";
import type {
  Adjective,
  ResponseIdentityMode,
  SessionSummary,
} from "@/lib/types";
import { formatDate, formatRelativeCount } from "@/lib/utils";

function DashboardExperience() {
  const router = useRouter();
  const { user, logout, changePassword, withAuthorized } = useAuth();
  const [adjectives, setAdjectives] = useState<Adjective[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "My Johari Window",
    adjectiveIds: [] as number[],
    inviteExpiresInDays: 7,
    responseIdentityMode: "named" as ResponseIdentityMode,
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [adjectiveData, sessionData] = await Promise.all([
          withAuthorized((accessToken) => listAdjectives(accessToken)),
          withAuthorized((accessToken) => listMySessions(accessToken)),
        ]);

        if (!cancelled) {
          setAdjectives(adjectiveData.adjectives);
          setSessions(sessionData.sessions);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(extractErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [withAuthorized]);

  const totalResponses = useMemo(
    () =>
      sessions.reduce(
        (sum, session) => sum + (session.peerSubmissionCount ?? 0),
        0,
      ),
    [sessions],
  );

  const handleCreateSession = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const created = await withAuthorized((accessToken) =>
        createSession(accessToken, form),
      );
      setSessions((current) => [created.session, ...current]);
      setMessage("Session created. Opening the owner view now.");
      router.push(`/session/${created.session.id}`);
    } catch (createError) {
      setError(extractErrorMessage(createError));
    } finally {
      setPending(false);
    }
  };

  const handlePasswordChange = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPasswordPending(true);
    setError(null);
    setMessage(null);

    try {
      await changePassword(passwordForm);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
      });
      setAccountMenuOpen(false);
      setMessage("Password changed. All older refresh sessions were revoked.");
    } catch (passwordError) {
      setError(extractErrorMessage(passwordError));
    } finally {
      setPasswordPending(false);
    }
  };

  return (
    <div className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1440px] flex-col px-6 py-8 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-6">
          <div className="space-y-2">
            <div className="section-kicker">Owner dashboard</div>
            <h1 className="font-[var(--font-display)] text-5xl tracking-[-0.05em]">
              {user?.fullName ?? user?.email.split("@")[0]}&rsquo;s reflection
              room
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/">
              <Button tone="ghost">Home</Button>
            </Link>
            <Button
              tone="ghost"
              onClick={() => setAccountMenuOpen((current) => !current)}
            >
              Account
            </Button>
            <Button tone="danger" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>

        {accountMenuOpen ? (
          <div className="mt-6 flex justify-end">
            <Panel className="w-full max-w-xl space-y-5">
              <SectionHeading
                kicker="Account care"
                title="Change your password without leaving the dashboard."
                description="Updating it revokes your older refresh sessions automatically."
              />

              <form className="space-y-4" onSubmit={handlePasswordChange}>
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current password</Label>
                  <TextInput
                    id="current-password"
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        currentPassword: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="new-password">New password</Label>
                  <TextInput
                    id="new-password"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        newPassword: event.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    className="min-w-44"
                    tone="secondary"
                    disabled={passwordPending}
                  >
                    {passwordPending ? "Updating password..." : "Change password"}
                  </Button>
                  <Button
                    type="button"
                    tone="ghost"
                    onClick={() => setAccountMenuOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </form>
            </Panel>
          </div>
        ) : null}

        <div className="grid gap-8 py-10 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Panel className="space-y-6">
              <SectionHeading
                kicker="Create session"
                title="Spin up a new Johari round."
                description="Pick your own adjectives first, choose whether respondents stay named or anonymous, and set the invite expiry."
              />

              {message ? <Notice tone="success">{message}</Notice> : null}
              {error ? <Notice tone="danger">{error}</Notice> : null}

              <form className="space-y-6" onSubmit={handleCreateSession}>
                <div className="space-y-2">
                  <Label htmlFor="session-title">Session title</Label>
                  <TextInput
                    id="session-title"
                    value={form.title}
                    onChange={(event) =>
                      setForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    placeholder="My Johari Window"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="identity-mode">Response mode</Label>
                    <SelectInput
                      id="identity-mode"
                      value={form.responseIdentityMode}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          responseIdentityMode: event.target
                            .value as ResponseIdentityMode,
                        }))
                      }
                    >
                      <option value="named">Named feedback</option>
                      <option value="anonymous">Anonymous feedback</option>
                    </SelectInput>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiry-days">Invite expiry</Label>
                    <SelectInput
                      id="expiry-days"
                      value={String(form.inviteExpiresInDays)}
                      onChange={(event) =>
                        setForm((current) => ({
                          ...current,
                          inviteExpiresInDays: Number(event.target.value),
                        }))
                      }
                    >
                      <option value="1">1 day</option>
                      <option value="3">3 days</option>
                      <option value="7">7 days</option>
                      <option value="14">14 days</option>
                      <option value="30">30 days</option>
                    </SelectInput>
                  </div>
                </div>

                <AdjectiveSelector
                  adjectives={adjectives}
                  selectedIds={form.adjectiveIds}
                  onChange={(nextValue) =>
                    setForm((current) => ({
                      ...current,
                      adjectiveIds: nextValue,
                    }))
                  }
                  title="Your starting adjectives"
                  hint="Choose the words you would use for yourself before you invite anyone else."
                  displayNameRequired={form.responseIdentityMode === "named"}
                />

                <Button
                  className="w-full"
                  disabled={pending || !adjectives.length}
                >
                  {pending ? "Creating session..." : "Create session"}
                </Button>
              </form>
            </Panel>
          </div>

          <div className="space-y-6">
            <Panel className="grid gap-4 md:grid-cols-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/3 px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                  Sessions
                </div>
                <div className="mt-2 font-[var(--font-display)] text-4xl tracking-[-0.04em]">
                  {sessions.length}
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[rgba(199,255,125,0.25)] bg-[rgba(199,255,125,0.08)] px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                  Responses
                </div>
                <div className="mt-2 font-[var(--font-display)] text-4xl tracking-[-0.04em]">
                  {totalResponses}
                </div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[rgba(255,143,63,0.25)] bg-[rgba(255,143,63,0.08)] px-4 py-4">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                  Identity mode
                </div>
                <div className="mt-2 text-lg font-bold text-[var(--text)]">
                  {form.responseIdentityMode === "named"
                    ? "Named by default"
                    : "Anonymous by default"}
                </div>
              </div>
            </Panel>

            <Panel className="space-y-6">
              <SectionHeading
                kicker="Your sessions"
                title="Open a room, share a code, then return for the pattern."
                description="Every card below can take you back to invite sharing, self selections, results, and AI feedback."
              />

              {loading ? (
                <Notice tone="neutral">
                  Loading your existing sessions...
                </Notice>
              ) : null}

              {!loading && !sessions.length ? (
                <Notice tone="warning">
                  You have not created a session yet. Build one on the left and
                  we&apos;ll open it immediately.
                </Notice>
              ) : null}

              <div className="grid gap-4">
                {sessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => router.push(`/session/${session.id}`)}
                    className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-[rgba(255,255,255,0.03)] p-5 text-left transition hover:border-[var(--line-strong)] hover:bg-[rgba(255,255,255,0.05)]"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="section-kicker">
                          {session.responseIdentityMode}
                        </div>
                        <h3 className="font-[var(--font-display)] text-3xl tracking-[-0.04em]">
                          {session.title}
                        </h3>
                        <p className="text-sm text-[var(--text-subtle)]">
                          Created {formatDate(session.createdAt)} - Invite code{" "}
                          {session.inviteCode}
                        </p>
                      </div>

                      <div className="rounded-full border border-[var(--line)] px-4 py-2 font-[var(--font-mono)] text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
                        {formatRelativeCount(
                          session.peerSubmissionCount ?? 0,
                          "response",
                        )}
                      </div>
                    </div>

                    <div className="mt-5 flex flex-wrap items-center gap-3 text-sm text-[var(--text-muted)]">
                      <span>Expires {formatDate(session.inviteExpiresAt)}</span>
                      <span>-</span>
                      <span>
                        {session.requiresDisplayName
                          ? "Respondents are named"
                          : "Respondents stay anonymous"}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardExperience />
    </AuthGuard>
  );
}
