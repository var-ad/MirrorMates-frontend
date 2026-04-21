"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ResultsGrid } from "@/components/johari/results-grid";
import { ReportRichText } from "@/components/johari/report-rich-text";
import { useToast } from "@/components/providers/toast-provider";
import { Button, Notice, Panel } from "@/components/ui/primitives";
import { extractErrorMessage, generateReportFromToken } from "@/lib/api";
import type { PublicReportGenerateResponse } from "@/lib/types";

export default function ReportGeneratePage() {
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<PublicReportGenerateResponse | null>(
    null,
  );

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError("This report link is missing its token.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        const response = await generateReportFromToken(token);

        if (!cancelled) {
          setReport(response);
          showToast({
            message: "Your report is ready.",
            tone: "success",
          });
        }
      } catch (generateError) {
        if (!cancelled) {
          setError(extractErrorMessage(generateError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [searchParams, showToast]);

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
      <Panel className="w-full max-w-3xl space-y-6">
        <div className="space-y-2">
          <div className="section-kicker">Report link</div>
          <h1 className="font-[var(--font-display)] text-4xl tracking-[-0.04em] md:text-5xl">
            {loading
              ? "Generating your Johari report..."
              : report
                ? `Report ready for ${report.sessionTitle}`
                : "We could not open this report link."}
          </h1>
        </div>

        {error ? <Notice tone="danger">{error}</Notice> : null}

        {report ? (
          <div className="space-y-4">
            <ResultsGrid results={report.results} />
            <p className="text-sm text-[var(--text-muted)]">
              Generated at {new Date(report.generatedAt).toLocaleString()}.
            </p>
            <div className="rounded-3xl border border-white/10 bg-[rgba(255,255,255,0.03)] p-6 text-[var(--text-primary)] shadow-[0_24px_60px_rgba(0,0,0,0.18)]">
              <ReportRichText text={report.reportText} />
            </div>
            <div className="flex flex-wrap gap-3">
              <Link href="/dashboard" prefetch={false}>
                <Button tone="ghost">Open dashboard</Button>
              </Link>
              <Link href="/" prefetch={false}>
                <Button tone="secondary">Back to home</Button>
              </Link>
            </div>
          </div>
        ) : null}
      </Panel>
    </main>
  );
}
