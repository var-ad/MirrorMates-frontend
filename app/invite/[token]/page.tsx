"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AdjectiveSelector } from "@/components/johari/adjective-selector";
import {
  Button,
  Label,
  Notice,
  Panel,
  SectionHeading,
  TextInput,
} from "@/components/ui/primitives";
import { extractErrorMessage, getInviteMeta, submitInvite } from "@/lib/api";
import type { Adjective, InviteMeta } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export default function InvitePage() {
  const params = useParams<{ token: string }>();
  const token = Array.isArray(params.token) ? params.token[0] : params.token;
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteMeta | null>(null);
  const [adjectives, setAdjectives] = useState<Adjective[]>([]);
  const [displayName, setDisplayName] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadInvite = async () => {
      if (!token) {
        setError("Invalid invite link.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const result = await getInviteMeta(token);
        if (!cancelled) {
          setInvite(result.invite);
          setAdjectives(result.adjectives);
        }
      } catch (inviteError) {
        if (!cancelled) {
          setError(extractErrorMessage(inviteError));
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
      setError("Invalid invite link.");
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      await submitInvite(token, {
        displayName: invite?.requiresDisplayName ? displayName : undefined,
        adjectiveIds: selectedIds,
      });
      setSubmitted(true);
      setMessage("Feedback sent. Thanks for helping shape a clearer picture.");
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
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
            {error ?? "This invite could not be opened."}
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
            <div className="section-kicker">MirrorMates invite</div>
            <h1 className="font-[var(--font-display)] text-4xl tracking-[-0.04em]">
              {invite.title}
            </h1>
          </Link>

          <div className="rounded-full border border-[var(--line)] bg-white/4 px-4 py-2 font-[var(--font-mono)] text-xs uppercase tracking-[0.18em] text-[var(--text-muted)]">
            Code {invite.inviteCode}
          </div>
        </header>

        <div className="grid gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <Panel className="space-y-6">
            <SectionHeading
              kicker="Public feedback"
              title={`Help ${invite.ownerLabel} see what they already project.`}
              description="Pick the adjectives that feel accurate to you. This will drop into the Johari grid on the owner's side."
            />

            <div className="rounded-[var(--radius-lg)] border border-[var(--line)] bg-white/4 p-5">
              <Image
                src={invite.qrCodeDataUrl}
                alt={`QR code for ${invite.title}`}
                width={320}
                height={320}
                unoptimized
                className="mx-auto aspect-square w-full max-w-xs rounded-[var(--radius-md)] bg-white p-3"
              />
            </div>

            <div className="space-y-3 text-base leading-7 text-[var(--text-muted)]">
              <p>Invite expires {formatDate(invite.inviteExpiresAt)}.</p>
              <p>
                {invite.requiresDisplayName
                  ? "This is a named session, so your display name is part of the response."
                  : "This is an anonymous session, so your name stays out of the submission."}
              </p>
            </div>
          </Panel>

          <Panel paper className="space-y-6">
            {message ? <Notice tone="success">{message}</Notice> : null}
            {error ? <Notice tone="danger">{error}</Notice> : null}

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
                  adjectives={adjectives}
                  selectedIds={selectedIds}
                  onChange={setSelectedIds}
                  title="Choose the adjectives that fit"
                  hint="Select the words that feel most true about the person who shared this invite."
                  displayNameRequired={invite.requiresDisplayName}
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
