"use client";

import { startTransition, useDeferredValue, useMemo, useState } from "react";
import type { Adjective } from "@/lib/types";
import { cn, formatRelativeCount } from "@/lib/utils";
import { Button, Notice, TextInput } from "@/components/ui/primitives";

export function AdjectiveSelector({
  adjectives,
  selectedIds,
  onChange,
  title = "Choose adjectives",
  hint = "Select the words that feel most true for this moment.",
  maxSelections = 50,
  displayNameRequired = false,
  orderMode = "selected-first",
}: {
  adjectives: Adjective[];
  selectedIds: number[];
  onChange: (nextValue: number[]) => void;
  title?: string;
  hint?: string;
  maxSelections?: number;
  displayNameRequired?: boolean;
  orderMode?: "selected-first" | "input";
}) {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);

  const filtered = useMemo(() => {
    const query = deferredSearch.trim().toLowerCase();
    const base = query
      ? adjectives.filter((adjective) =>
          adjective.word.toLowerCase().includes(query),
        )
      : adjectives;

    if (orderMode === "input") {
      return base;
    }

    return [...base].sort((a, b) => {
      const aSelected = selectedSet.has(a.id) ? 1 : 0;
      const bSelected = selectedSet.has(b.id) ? 1 : 0;
      return bSelected - aSelected || a.word.localeCompare(b.word);
    });
  }, [adjectives, deferredSearch, orderMode, selectedSet]);

  const toggle = (adjectiveId: number) => {
    const isSelected = selectedSet.has(adjectiveId);
    const nextValue = isSelected
      ? selectedIds.filter((id) => id !== adjectiveId)
      : [...selectedIds, adjectiveId];

    if (!isSelected && selectedIds.length >= maxSelections) {
      return;
    }

    startTransition(() => {
      onChange(nextValue);
    });
  };

  const clear = () => {
    startTransition(() => {
      onChange([]);
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <h3 className="font-[var(--font-display)] text-3xl tracking-[-0.04em]">
            {title}
          </h3>
          <p className="max-w-2xl text-base leading-7 text-[var(--text-muted)]">
            {hint}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-full border border-[var(--line)] bg-white/5 px-4 py-2 text-sm text-[var(--text-muted)]">
            {formatRelativeCount(selectedIds.length, "word")} selected
          </div>
          <Button
            type="button"
            tone="ghost"
            onClick={clear}
            disabled={!selectedIds.length}
          >
            Clear all
          </Button>
        </div>
      </div>

      <div className="pill-grid">
        {filtered.map((adjective) => {
          const isSelected = selectedSet.has(adjective.id);
          const atLimit = !isSelected && selectedIds.length >= maxSelections;

          return (
            <button
              key={adjective.id}
              type="button"
              onClick={() => toggle(adjective.id)}
              disabled={atLimit}
              className={cn(
                "rounded-full border px-4 py-2 text-left text-sm font-bold tracking-[0.02em] transition",
                isSelected
                  ? "border-[var(--accent)] bg-[var(--accent-soft)] text-[#c45c00]"
                  : "border-[var(--line)] bg-[rgba(255,255,255,0.03)] text-[var(--text-muted)] hover:border-[var(--line-strong)] hover:text-[var(--text)]",
                atLimit && "cursor-not-allowed opacity-40",
              )}
            >
              {adjective.word}
            </button>
          );
        })}
      </div>
    </div>
  );
}
