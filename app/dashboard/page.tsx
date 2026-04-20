"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/ui/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
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

function shuffleAdjectives(adjectives: Adjective[]): Adjective[] {
  const next = [...adjectives];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function DashboardExperience() {
  const router = useRouter();
  const { user, logout, withAuthorized } = useAuth();
  const { showToast } = useToast();
  const [adjectives, setAdjectives] = useState<Adjective[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    title: "My Johari Window",
    adjectiveIds: [] as number[],
    inviteExpiresInDays: 7,
    responseIdentityMode: "named" as ResponseIdentityMode,
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
          showToast({
            message: extractErrorMessage(loadError),
            tone: "danger",
          });
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
  }, [showToast, withAuthorized]);

  const totalResponses = useMemo(
    () =>
      sessions.reduce(
        (sum, session) => sum + (session.peerSubmissionCount ?? 0),
        0,
      ),
    [sessions],
  );

  const randomizedAdjectives = useMemo(
    () => shuffleAdjectives(adjectives),
    [adjectives],
  );

  const handleCreateSession = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    setPending(true);

    try {
      const created = await withAuthorized((accessToken) =>
        createSession(accessToken, form),
      );
      setSessions((current) => [created.session, ...current]);
      showToast({
        message: "Session created. Opening the owner view now.",
        tone: "success",
      });
      router.push(`/session/${created.session.id}`);
    } catch (createError) {
      showToast({
        message: extractErrorMessage(createError),
        tone: "danger",
      });
    } finally {
      setPending(false);
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
            {user?.hasPasswordLogin ? (
              <Link href="/dashboard/account">
                <Button tone="ghost">Account</Button>
              </Link>
            ) : null}
            <Button tone="danger" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </header>

        <div className="grid gap-8 py-10 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <Panel className="space-y-6">
              <SectionHeading
                kicker="Create session"
                title="Spin up a new Johari round."
                description="Pick your own adjectives first, choose whether respondents stay named or anonymous, and set the invite expiry."
              />

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
                  adjectives={randomizedAdjectives}
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
                  orderMode="input"
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
            <Panel className="grid gap-4 md:grid-cols-2">
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
