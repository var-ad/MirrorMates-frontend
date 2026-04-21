"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ReportRichText } from "@/components/johari/report-rich-text";
import { ResultsGrid } from "@/components/johari/results-grid";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { AuthGuard } from "@/components/ui/auth-guard";
import {
  Button,
  Notice,
  Panel,
  SectionHeading,
} from "@/components/ui/primitives";
import {
  extractErrorMessage,
  generateReport,
  getLatestReport,
  getResults,
  getSession,
} from "@/lib/api";
import type {
  LatestReportResponse,
  ResultsResponse,
  SessionSummary,
} from "@/lib/types";
import { formatDate } from "@/lib/utils";

function SessionReportExperience() {
  const params = useParams<{ id: string }>();
  const sessionId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { withAuthorized } = useAuth();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [session, setSession] = useState<SessionSummary | null>(null);
  const [results, setResults] = useState<ResultsResponse | null>(null);
  const [latestReport, setLatestReport] = useState<LatestReportResponse | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!sessionId) {
        setPageError("Invalid session link.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError(null);

      try {
        const [sessionData, resultsData, reportData] = await Promise.all([
          withAuthorized((accessToken) => getSession(accessToken, sessionId)),
          withAuthorized((accessToken) => getResults(accessToken, sessionId)),
          withAuthorized((accessToken) =>
            getLatestReport(accessToken, sessionId),
          ),
        ]);

        if (!cancelled) {
          setSession(sessionData.session);
          setResults(resultsData);
          setLatestReport(reportData);
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

    void load();

    return () => {
      cancelled = true;
    };
  }, [sessionId, withAuthorized]);

  const handleGenerateReport = async () => {
    if (!sessionId) {
      return;
    }

    setGenerating(true);

    try {
      await withAuthorized((accessToken) =>
        generateReport(accessToken, sessionId),
      );

      const [resultsData, reportData] = await Promise.all([
        withAuthorized((accessToken) => getResults(accessToken, sessionId)),
        withAuthorized((accessToken) =>
          getLatestReport(accessToken, sessionId),
        ),
      ]);

      setResults(resultsData);
      setLatestReport(reportData);
      showToast({
        message: "Report generated from current responses.",
        tone: "success",
      });
    } catch (reportError) {
      showToast({
        message: extractErrorMessage(reportError),
        tone: "danger",
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
        <Panel className="max-w-xl text-center">
          <p className="section-kicker justify-center">Loading report</p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl tracking-[-0.04em]">
            Rebuilding your Johari report workspace.
          </h1>
        </Panel>
      </main>
    );
  }

  if (!session || !results) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
        <Panel className="max-w-xl space-y-4 text-center">
          <Notice tone="danger">
            {pageError ?? "Could not load this report page."}
          </Notice>
          <Link href="/dashboard">
            <Button>Back to dashboard</Button>
          </Link>
        </Panel>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1480px] flex-col px-6 py-8 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-6">
          <div className="space-y-2">
            <div className="section-kicker">Report workspace</div>
            <h1 className="font-[var(--font-display)] text-5xl tracking-[-0.05em]">
              {session.title}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <Link href={`/session/${session.id}`}>
              <Button tone="ghost">Back to session</Button>
            </Link>
          </div>
        </header>

        <div className="grid gap-8 py-8 xl:grid-cols-[1.05fr_0.95fr]">
          <div>{results ? <ResultsGrid results={results} /> : null}</div>

          <Panel className="space-y-5">
            <SectionHeading
              kicker="AI reflection"
              title="Generate report as of current responses"
              description="You can regenerate this anytime to capture the latest participant input."
            />

            <Button onClick={handleGenerateReport} disabled={generating}>
              {generating ? "Generating report..." : "Generate report now"}
            </Button>

            {latestReport?.feedback ? (
              <div className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--line)] bg-white/4 p-5">
                <div className="text-xs uppercase tracking-[0.18em] text-[var(--text-subtle)]">
                  Generated {formatDate(latestReport.feedback.generatedAt)}
                </div>
                <ReportRichText text={latestReport.feedback.text} />
              </div>
            ) : (
              <Notice tone="neutral">
                No report generated yet. Generate one when ready.
              </Notice>
            )}
          </Panel>
        </div>
      </div>
    </main>
  );
}

export default function SessionReportPage() {
  return (
    <AuthGuard>
      <SessionReportExperience />
    </AuthGuard>
  );
}
