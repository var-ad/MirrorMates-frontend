"use client";

import type { ResultsResponse } from "@/lib/types";
import { cn, formatRelativeCount } from "@/lib/utils";
import { Metric, Panel, SectionHeading } from "@/components/ui/primitives";

const WINDOW_ACCENTS: Record<
  ResultsResponse["windows"][number]["key"],
  { ring: string; glow: string }
> = {
  open: {
    ring: "border-[rgba(199,255,125,0.34)]",
    glow: "from-[rgba(199,255,125,0.22)] to-transparent",
  },
  blind: {
    ring: "border-[rgba(149,215,255,0.34)]",
    glow: "from-[rgba(149,215,255,0.2)] to-transparent",
  },
  hidden: {
    ring: "border-[rgba(255,143,63,0.34)]",
    glow: "from-[rgba(255,143,63,0.2)] to-transparent",
  },
  unknown: {
    ring: "border-[rgba(255,255,255,0.16)]",
    glow: "from-[rgba(255,255,255,0.14)] to-transparent",
  },
};

export function ResultsGrid({ results }: { results: ResultsResponse }) {
  return (
    <section className="space-y-8">
      <SectionHeading
        kicker="Johari map"
        title="Four windows, one clearer picture."
        description="Your grid updates from your own adjective picks and the words other people chose for you."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Metric
          label="Self selections"
          value={results.summary.selfSelectedCount}
        />
        <Metric
          label="Peer submissions"
          value={results.summary.peerSubmissionCount}
          accent="signal"
        />
        <Metric
          label="Peer traits surfaced"
          value={results.summary.peerSelectedUniqueCount}
          accent="accent"
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        {results.windows.map((window) => {
          return (
            <Panel
              key={window.key}
              className={cn(
                "relative h-full min-h-[30rem] overflow-hidden border",
                WINDOW_ACCENTS[window.key].ring,
              )}
            >
              <div
                className={cn(
                  "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-80",
                  WINDOW_ACCENTS[window.key].glow,
                )}
              />
              <div className="relative flex h-full flex-col gap-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-2">
                    <p className="section-kicker">{window.subtitle}</p>
                    <h3 className="font-[var(--font-display)] text-3xl tracking-[-0.04em]">
                      {window.title}
                    </h3>
                    <p className="max-w-xl text-base leading-7 text-[var(--text-muted)]">
                      {window.description}
                    </p>
                  </div>
                  <div className="rounded-full border border-[var(--line)] bg-black/20 px-4 py-2 font-[var(--font-mono)] text-sm uppercase tracking-[0.18em] text-[var(--text-muted)]">
                    {window.count}
                  </div>
                </div>

                <div className="flex flex-1 flex-col overflow-hidden">
                  {window.key === "unknown" ? (
                    <div className="flex h-full flex-col justify-between rounded-[var(--radius-md)] border border-dashed border-[var(--line)] bg-black/12 px-5 py-6">
                      <div className="space-y-4">
                        <div className="font-[var(--font-display)] text-6xl tracking-[-0.05em] text-[var(--text)]">
                          {window.count}
                        </div>
                        <div className="text-lg leading-8 text-[var(--text-muted)]">
                          {window.count === 0
                            ? "Nothing sat outside awareness in this round."
                            : `${formatRelativeCount(window.count, "trait")} were outside this session's awareness.`}
                        </div>
                      </div>
                    </div>
                  ) : window.adjectives.length ? (
                    <div className="flex h-full flex-col">
                      <div className="grid gap-3 md:grid-cols-2">
                        {window.adjectives.map((adjective) => (
                          <div
                            key={adjective.adjectiveId}
                            className="min-w-0 rounded-[var(--radius-md)] border border-[var(--line)] bg-black/18 px-4 py-4"
                          >
                            <div className="min-w-0 space-y-2">
                              <div className="break-words text-base font-semibold capitalize leading-6 text-[var(--text)]">
                                {adjective.adjective}
                              </div>
                              {adjective.peerCount > 0 ? (
                                <div className="text-xs text-[var(--text-subtle)]">
                                  {formatRelativeCount(
                                    adjective.peerCount,
                                    "peer",
                                  )}{" "}
                                  noticed this
                                </div>
                              ) : null}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--line)] px-4 py-6 text-sm text-[var(--text-subtle)]">
                      Nothing landed here yet. More peer responses will make
                      this window sharper.
                    </div>
                  )}
                </div>
              </div>
            </Panel>
          );
        })}
      </div>
    </section>
  );
}
