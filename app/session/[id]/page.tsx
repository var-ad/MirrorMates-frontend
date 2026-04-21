"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AuthGuard } from "@/components/ui/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { AdjectiveSelector } from "@/components/johari/adjective-selector";
import { ResultsGrid } from "@/components/johari/results-grid";
import {
  Button,
  Label,
  Notice,
  Panel,
  SectionHeading,
  TextInput,
} from "@/components/ui/primitives";
import {
  extractErrorMessage,
  getResults,
  getSession,
  listAdjectives,
  saveSelfSelections,
  updateInviteSettings,
} from "@/lib/api";
import type {
  Adjective,
  ResponseIdentityMode,
  ResultsResponse,
  SessionSummary,
} from "@/lib/types";
import { copyToClipboard, formatDate } from "@/lib/utils";

function toDateTimeLocalValue(value: string) {
  const date = new Date(value);
  const timezoneOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffset).toISOString().slice(0, 16);
}

function shuffleAdjectives(adjectives: Adjective[]): Adjective[] {
  const next = [...adjectives];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function isProbablyMobileDevice() {
  if (typeof navigator === "undefined") {
    return false;
  }

  const userAgentData = navigator as Navigator & {
    userAgentData?: {
      mobile?: boolean;
    };
  };

  if (typeof userAgentData.userAgentData?.mobile === "boolean") {
    return userAgentData.userAgentData.mobile;
  }

  return /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent);
}

function SessionExperience() {
  const params = useParams<{ id: string }>();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { user, withAuthorized } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [shareBusy, setShareBusy] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [adjectives, setAdjectives] = useState<Adjective[]>([]);
  const [selfSelections, setSelfSelections] = useState<number[]>([]);
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [responseIdentityMode, setResponseIdentityMode] =
    useState<ResponseIdentityMode>("named");

  const randomizedAdjectives = useMemo(
    () => shuffleAdjectives(adjectives),
    [adjectives],
  );

  const ownerLabel = useMemo(() => {
    if (!user) {
      return "Someone";
    }

    return user.fullName ?? user.email.split("@")[0];
  }, [user]);

  const whatsappMessage = useMemo(() => {
    if (!session) {
      return "";
    }

    const responseModeLine = session.share.requiresDisplayName
      ? "This round uses named feedback."
      : "This round lets you respond anonymously.";

    return [
      `${ownerLabel} invited you to join their MirrorMates session.`,
      `Session: ${session.title}`,
      "Open the invite link below to respond.",
      responseModeLine,
      `Invite link: ${session.share.inviteUrl}`,
    ].join("\n");
  }, [ownerLabel, session]);

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      if (!sessionId) {
        setPageError("Invalid session link.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError(null);

      try {
        const [adjectiveData, sessionData, resultData] = await Promise.all([
          withAuthorized((accessToken) => listAdjectives(accessToken)),
          withAuthorized((accessToken) => getSession(accessToken, sessionId)),
          withAuthorized((accessToken) => getResults(accessToken, sessionId)),
        ]);

        if (!cancelled) {
          setAdjectives(adjectiveData.adjectives);
          setSession(sessionData.session);
          setSelfSelections(sessionData.selfSelectionAdjectiveIds);
          setResults(resultData);
          setInviteExpiresAt(
            toDateTimeLocalValue(sessionData.session.inviteExpiresAt),
          );
          setResponseIdentityMode(sessionData.session.responseIdentityMode);
        }
      } catch (loadError) {
        if (!cancelled) {
          setPageError(extractErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, withAuthorized]);

  const handleSaveSelections = async () => {
    if (!sessionId) {
      return;
    }

    setBusy(true);

    try {
      await withAuthorized((accessToken) =>
        saveSelfSelections(accessToken, sessionId, selfSelections),
      );
      const refreshedResults = await withAuthorized((accessToken) =>
        getResults(accessToken, sessionId),
      );
      setResults(refreshedResults);
      showToast({
        message: "Self selections saved and results refreshed.",
        tone: "success",
      });
    } catch (saveError) {
      showToast({
        message: extractErrorMessage(saveError),
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  };

  const handleSaveInvite = async () => {
    if (!sessionId) {
      return;
    }

    setBusy(true);

    try {
      const updated = await withAuthorized((accessToken) =>
        updateInviteSettings(accessToken, sessionId, {
          inviteExpiresAt: new Date(inviteExpiresAt).toISOString(),
          responseIdentityMode,
        }),
      );
      setSession(updated.session);
      showToast({
        message: "Invite settings updated.",
        tone: "success",
      });
    } catch (inviteError) {
      showToast({
        message: extractErrorMessage(inviteError),
        tone: "danger",
      });
    } finally {
      setBusy(false);
    }
  };

  const copyValue = async (value: string, description: string) => {
    try {
      await copyToClipboard(value);
      showToast({
        message: `${description} copied.`,
        tone: "success",
      });
    } catch {
      showToast({
        message: `Could not copy ${description.toLowerCase()} on this device.`,
        tone: "danger",
      });
    }
  };

  const handleShareOnWhatsApp = async () => {
    if (!session) {
      return;
    }

    setShareBusy(true);

    try {
      const encodedMessage = encodeURIComponent(whatsappMessage);
      const mobileAppUrl = `whatsapp://send?text=${encodedMessage}`;
      const mobileFallbackUrl = `https://api.whatsapp.com/send?text=${encodedMessage}`;
      const desktopWebUrl = `https://web.whatsapp.com/send?text=${encodedMessage}`;

      if (isProbablyMobileDevice()) {
        const fallbackTimer = window.setTimeout(() => {
          window.location.assign(mobileFallbackUrl);
        }, 1200);

        const cancelFallback = () => {
          window.clearTimeout(fallbackTimer);
        };

        window.addEventListener("pagehide", cancelFallback, { once: true });
        document.addEventListener("visibilitychange", cancelFallback, {
          once: true,
        });

        window.location.assign(mobileAppUrl);
        return;
      }

      window.open(desktopWebUrl, "_blank", "noopener,noreferrer");
      showToast({
        message: "Opened WhatsApp Web with your preset invite message.",
        tone: "success",
      });
    } catch {
      showToast({
        message: "Could not open WhatsApp right now.",
        tone: "danger",
      });
    } finally {
      setShareBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
        <Panel className="max-w-xl text-center">
          <p className="section-kicker justify-center">Loading session</p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl tracking-[-0.04em]">
            Rebuilding this Johari room from your backend.
          </h1>
        </Panel>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
        <Panel className="max-w-xl space-y-4 text-center">
          <Notice tone="danger">
            {pageError ?? "We could not load this session."}
          </Notice>
          <Link href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </Panel>
      </div>
    );
  }

  return (
    <div className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-6 py-8 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-6">
          <div className="space-y-2">
            <div className="section-kicker">Session control</div>
            <h1 className="font-[var(--font-display)] text-5xl tracking-[-0.05em]">
              {session.title}
            </h1>
            <p className="text-base text-[var(--text-muted)]">
              Created {formatDate(session.createdAt)} - Invite code{" "}
              {session.inviteCode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button tone="ghost">Dashboard</Button>
            </Link>
          </div>
        </header>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Panel className="space-y-6">
              <SectionHeading
                kicker="Share"
                title="Send a polished invite in one pass."
                description="Use WhatsApp with a ready-made caption, copy the invite details, or hand over the QR code directly."
              />

              <div className="grid gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
                <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-white/4 p-5">
                  <div className="flex flex-col items-center text-center">
                    <Image
                      src={session.share.qrCodeDataUrl}
                      alt={`QR code for ${session.title}`}
                      width={320}
                      height={320}
                      unoptimized
                      className="aspect-square w-full max-w-xs rounded-[var(--radius-md)] bg-white p-3"
                    />
                    <div className="mt-5 font-[var(--font-mono)] text-3xl tracking-[0.26em] text-[var(--text)]">
                      {session.inviteCode}
                    </div>
                  </div>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-white/4 p-5">
                  <div className="flex flex-col gap-2">
                    <Button
                      className="w-full"
                      onClick={() => void handleShareOnWhatsApp()}
                      disabled={shareBusy || session.share.isExpired}
                    >
                      {shareBusy ? "Opening WhatsApp..." : "Share on WhatsApp"}
                    </Button>
                    <Button
                      tone="secondary"
                      className="w-full"
                      onClick={() =>
                        void copyValue(session.share.inviteUrl, "Invite link")
                      }
                      disabled={session.share.isExpired}
                    >
                      Copy invite link
                    </Button>
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-white/4 p-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-center">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Label htmlFor="session-expiry">Invite expiry</Label>
                    <TextInput
                      id="session-expiry"
                      type="datetime-local"
                      value={inviteExpiresAt}
                      onChange={(event) =>
                        setInviteExpiresAt(event.target.value)
                      }
                    />
                  </div>
                  <Button
                    tone="secondary"
                    className="md:mt-8"
                    onClick={handleSaveInvite}
                    disabled={busy}
                  >
                    {busy ? "Saving..." : "Save"}
                  </Button>
                </div>

                <p className="mt-3 text-sm text-[var(--text-muted)]">
                  {session.requiresDisplayName
                    ? "Respondents are asked for a display name."
                    : "Respondents can stay anonymous."}
                </p>

                {session.share.isExpired ? (
                  <Notice tone="warning">
                    This invite has expired, so sharing actions are disabled
                    until you save a new expiry.
                  </Notice>
                ) : null}
              </div>
            </Panel>

            <Panel className="space-y-6">
              <AdjectiveSelector
                adjectives={randomizedAdjectives}
                selectedIds={selfSelections}
                onChange={setSelfSelections}
                title="Your self selections"
                hint="These are the adjectives you claim for yourself. Saving will refresh the Johari grid."
                displayNameRequired={responseIdentityMode === "named"}
                orderMode="input"
              />

              <Button onClick={handleSaveSelections} disabled={busy}>
                {busy ? "Saving selections..." : "Save self selections"}
              </Button>
            </Panel>
          </div>

          <div className="space-y-6">
            {results ? <ResultsGrid results={results} /> : null}

            <Panel className="space-y-5">
              <SectionHeading
                kicker="AI reflection"
                title="Generate a report from current responses."
                description="Open the dedicated report page anytime to generate and review the latest Gemini reflection."
              />

              <Link href={`/session/${session.id}/report`}>
                <Button>Generate report now</Button>
              </Link>
            </Panel>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SessionPage() {
  return (
    <AuthGuard>
      <SessionExperience />
    </AuthGuard>
  );
}
