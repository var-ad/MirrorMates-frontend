"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AuthGuard } from "@/components/ui/auth-guard";
import { useAuth } from "@/components/providers/auth-provider";
import { AdjectiveSelector } from "@/components/johari/adjective-selector";
import { ResultsGrid } from "@/components/johari/results-grid";
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
  extractErrorMessage,
  generateReport,
  getLatestReport,
  getResults,
  getSession,
  listAdjectives,
  saveSelfSelections,
  updateInviteSettings,
} from "@/lib/api";
import type {
  Adjective,
  LatestReportResponse,
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

function SessionExperience() {
  const params = useParams<{ id: string }>();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { withAuthorized } = useAuth();
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [adjectives, setAdjectives] = useState<Adjective[]>([]);
  const [selfSelections, setSelfSelections] = useState<number[]>([]);
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [latestReport, setLatestReport] = useState<LatestReportResponse | null>(
    null,
  );
  const [inviteExpiresAt, setInviteExpiresAt] = useState("");
  const [responseIdentityMode, setResponseIdentityMode] =
    useState<ResponseIdentityMode>("named");

  useEffect(() => {
    let cancelled = false;

    const loadSession = async () => {
      setLoading(true);
      setError(null);

      try {
        const [adjectiveData, sessionData, resultData, reportData] =
          await Promise.all([
            withAuthorized((accessToken) => listAdjectives(accessToken)),
            withAuthorized((accessToken) => getSession(accessToken, sessionId)),
            withAuthorized((accessToken) => getResults(accessToken, sessionId)),
            withAuthorized((accessToken) =>
              getLatestReport(accessToken, sessionId),
            ),
          ]);

        if (!cancelled) {
          setAdjectives(adjectiveData.adjectives);
          setSession(sessionData.session);
          setSelfSelections(sessionData.selfSelectionAdjectiveIds);
          setResults(resultData);
          setLatestReport(reportData);
          setInviteExpiresAt(
            toDateTimeLocalValue(sessionData.session.inviteExpiresAt),
          );
          setResponseIdentityMode(sessionData.session.responseIdentityMode);
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

    void loadSession();

    return () => {
      cancelled = true;
    };
  }, [sessionId, withAuthorized]);

  const handleSaveSelections = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      await withAuthorized((accessToken) =>
        saveSelfSelections(accessToken, sessionId, selfSelections),
      );
      const refreshedResults = await withAuthorized((accessToken) =>
        getResults(accessToken, sessionId),
      );
      setResults(refreshedResults);
      setMessage("Self selections saved and results refreshed.");
    } catch (saveError) {
      setError(extractErrorMessage(saveError));
    } finally {
      setBusy(false);
    }
  };

  const handleSaveInvite = async () => {
    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      const updated = await withAuthorized((accessToken) =>
        updateInviteSettings(accessToken, sessionId, {
          inviteExpiresAt: new Date(inviteExpiresAt).toISOString(),
          responseIdentityMode,
        }),
      );
      setSession(updated.session);
      setMessage("Invite settings updated.");
    } catch (inviteError) {
      setError(extractErrorMessage(inviteError));
    } finally {
      setBusy(false);
    }
  };

  const handleGenerateReport = async () => {
    setReportBusy(true);
    setError(null);
    setMessage(null);

    try {
      await withAuthorized((accessToken) => generateReport(accessToken, sessionId));
      const reportData = await withAuthorized((accessToken) =>
        getLatestReport(accessToken, sessionId),
      );
      setLatestReport(reportData);
      setMessage("Fresh report generated.");
    } catch (reportError) {
      setError(extractErrorMessage(reportError));
    } finally {
      setReportBusy(false);
    }
  };

  const copyValue = async (value: string, description: string) => {
    try {
      await copyToClipboard(value);
      setMessage(`${description} copied.`);
    } catch {
      setError(`Could not copy ${description.toLowerCase()} on this device.`);
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
            {error ?? "We could not load this session."}
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
              Created {formatDate(session.createdAt)} - Invite code {session.inviteCode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button tone="ghost">Dashboard</Button>
            </Link>
            <a href={session.share.inviteUrl} target="_blank" rel="noreferrer">
              <Button>Open public invite</Button>
            </a>
          </div>
        </header>

        <div className="space-y-6 py-8">
          {message ? <Notice tone="success">{message}</Notice> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}
        </div>

        <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-6">
            <Panel className="space-y-6">
              <SectionHeading
                kicker="Share"
                title="Invite people with a QR or a tight little code."
                description="Your backend already returns a share-ready link and data URL. This page just makes them usable."
              />

              <div className="grid gap-4 md:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-white/4 p-4">
                  <Image
                    src={session.share.qrCodeDataUrl}
                    alt={`QR code for ${session.title}`}
                    width={320}
                    height={320}
                    unoptimized
                    className="aspect-square w-full rounded-[var(--radius-md)] bg-white p-3"
                  />
                </div>

                <div className="space-y-4">
                  <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/4 px-4 py-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                      Invite code
                    </div>
                    <div className="mt-2 font-[var(--font-display)] text-4xl tracking-[0.08em]">
                      {session.inviteCode}
                    </div>
                    <div className="mt-4 flex gap-3">
                      <Button
                        tone="ghost"
                        onClick={() => void copyValue(session.inviteCode, "Invite code")}
                      >
                        Copy code
                      </Button>
                      <Button
                        onClick={() => void copyValue(session.share.inviteUrl, "Invite link")}
                      >
                        Copy invite link
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-[var(--radius-md)] border border-[var(--line)] bg-white/4 px-4 py-4">
                    <div className="text-sm text-[var(--text-muted)]">
                      Invite expires {formatDate(session.inviteExpiresAt)}
                    </div>
                    <div className="mt-2 text-sm text-[var(--text-muted)]">
                      {session.requiresDisplayName
                        ? "Respondents are asked for a display name."
                        : "Respondents can stay anonymous."}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="session-expiry">Invite expiry</Label>
                  <TextInput
                    id="session-expiry"
                    type="datetime-local"
                    value={inviteExpiresAt}
                    onChange={(event) => setInviteExpiresAt(event.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="session-mode">Response mode</Label>
                  <SelectInput
                    id="session-mode"
                    value={responseIdentityMode}
                    onChange={(event) =>
                      setResponseIdentityMode(
                        event.target.value as ResponseIdentityMode,
                      )
                    }
                  >
                    <option value="named">Named feedback</option>
                    <option value="anonymous">Anonymous feedback</option>
                  </SelectInput>
                </div>
              </div>

              <Button tone="secondary" onClick={handleSaveInvite} disabled={busy}>
                {busy ? "Saving invite settings..." : "Save invite settings"}
              </Button>
            </Panel>

            <Panel className="space-y-6">
              <AdjectiveSelector
                adjectives={adjectives}
                selectedIds={selfSelections}
                onChange={setSelfSelections}
                title="Your self selections"
                hint="These are the adjectives you claim for yourself. Saving will refresh the Johari grid."
                displayNameRequired={responseIdentityMode === "named"}
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
                title="Ask Gemini for a neutral read of the room."
                description="This uses the report endpoints from the backend and stores the latest generated response."
              />

              <Button onClick={handleGenerateReport} disabled={reportBusy}>
                {reportBusy ? "Generating report..." : "Generate fresh report"}
              </Button>

              {latestReport?.feedback ? (
                <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--line)] bg-white/4 p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                    Generated {formatDate(latestReport.feedback.generatedAt)}
                  </div>
                  <div className="text-lg leading-8 text-[var(--text)]">
                    {latestReport.feedback.text}
                  </div>
                </div>
              ) : (
                <Notice tone="neutral">
                  No report has been generated for this session yet.
                </Notice>
              )}
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
