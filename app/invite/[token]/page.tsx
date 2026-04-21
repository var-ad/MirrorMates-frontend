"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AdjectiveSelector } from "@/components/johari/adjective-selector";
import { useToast } from "@/components/providers/toast-provider";
import {
  Button,
  Label,
  Notice,
  Panel,
  TextInput,
} from "@/components/ui/primitives";
import { extractErrorMessage, getInviteMeta, submitInvite } from "@/lib/api";
import type { Adjective, InviteMeta } from "@/lib/types";

const INVITE_PEER_ID_STORAGE_PREFIX = "mirrormates:invite-peer-id:";

function shuffleAdjectives(adjectives: Adjective[]): Adjective[] {
  const next = [...adjectives];

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function generatePeerId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

function getOrCreateInvitePeerId(token: string): string | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const storageKey = `${INVITE_PEER_ID_STORAGE_PREFIX}${token.trim().toUpperCase()}`;

  try {
    const existing = window.localStorage.getItem(storageKey)?.trim();
    if (existing) {
      return existing;
    }

    const created = generatePeerId();
    window.localStorage.setItem(storageKey, created);
    return created;
  } catch {
    return undefined;
  }
}

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteMeta | null>(null);
  const [adjectives, setAdjectives] = useState<Adjective[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const randomizedAdjectives = useMemo(
    () => shuffleAdjectives(adjectives),
    [adjectives],
  );

  useEffect(() => {
    let cancelled = false;

    const loadInvite = async () => {
      if (!token) {
        setPageError("Invalid invite link.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setPageError(null);

      try {
        const result = await getInviteMeta(token);
        if (!cancelled) {
          setInvite(result.invite);
          setAdjectives(result.adjectives);
        }
      } catch (inviteError) {
        if (!cancelled) {
          setPageError(extractErrorMessage(inviteError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadInvite();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      setPageError("Invalid invite link.");
      return;
    }

    setSubmitting(true);

    try {
      const peerId = getOrCreateInvitePeerId(token);

      await submitInvite(
        token,
        {
          displayName: invite?.requiresDisplayName ? displayName : undefined,
          adjectiveIds: selectedIds,
        },
        {
          peerId,
        },
      );
      setSubmitted(true);
      showToast({
        message: "Feedback sent. Thanks for helping shape a clearer picture.",
        tone: "success",
      });
    } catch (submitError) {
      showToast({
        message: extractErrorMessage(submitError),
        tone: "danger",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
        <Panel className="max-w-xl text-center">
          <p className="section-kicker justify-center">Opening invite</p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl tracking-[-0.04em]">
            Pulling the session details into view.
          </h1>
        </Panel>
      </main>
    );
  }

  if (!invite) {
    return (
      <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
        <Panel className="max-w-xl space-y-4 text-center">
          <Notice tone="danger">
            {pageError ?? "This invite could not be opened."}
          </Notice>
          <Link href="/">
            <Button>MirrorMates home</Button>
          </Link>
        </Panel>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <div className="mx-auto flex min-h-screen w-full max-w-[1320px] flex-col px-6 py-8 md:px-10">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-6">
          <Link href="/" className="space-y-2">
            <div className="section-kicker">
              {invite.ownerLabel} has invited you to
            </div>
            <h1 className="font-[var(--font-display)] text-4xl tracking-[-0.04em]">
              {invite.title}
            </h1>
          </Link>

          <div className="rounded-full border border-[var(--line)] bg-white/4 px-4 py-2 font-[var(--font-mono)] text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Code {invite.inviteCode}
          </div>
        </header>

        <div className="flex justify-center py-10">
          <Panel paper className="w-full max-w-2xl space-y-6 bg-white/15">
            {submitted ? (
              <div className="space-y-5">
                <h2 className="font-[var(--font-display)] text-5xl tracking-[-0.05em]">
                  Feedback delivered.
                </h2>
                <p className="text-lg leading-8 text-[rgba(25,20,16,0.72)]">
                  Thanks for contributing. The owner can now see your adjectives
                  inside their Johari window.
                </p>
                <Link href="/">
                  <Button>Back to MirrorMates</Button>
                </Link>
              </div>
            ) : (
              <form className="space-y-6" onSubmit={handleSubmit}>
                {invite.requiresDisplayName ? (
                  <div className="space-y-2">
                    <Label htmlFor="display-name">Display name</Label>
                    <TextInput
                      id="display-name"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="How should they recognize you?"
                      required
                    />
                  </div>
                ) : null}

                <AdjectiveSelector
                  adjectives={randomizedAdjectives}
                  selectedIds={selectedIds}
                  onChange={setSelectedIds}
                  title="Choose the adjectives that fit"
                  hint="Select the words that feel most true about the person who shared this invite."
                  orderMode="input"
                />

                <Button className="w-full" disabled={submitting}>
                  {submitting ? "Sending feedback..." : "Submit feedback"}
                </Button>
              </form>
            )}
          </Panel>
        </div>
      </div>
    </main>
  );
}
