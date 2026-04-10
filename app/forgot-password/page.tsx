"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, Label, Notice, Panel, TextInput } from "@/components/ui/primitives";
import { extractErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const result = await forgotPassword(email);
      setMessage(result.message);
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (forgotError) {
      setError(extractErrorMessage(forgotError));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
      <Panel className="w-full max-w-xl">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="section-kicker">Password recovery</div>
            <h1 className="font-[var(--font-display)] text-5xl tracking-[-0.05em]">
              Ask for a reset code.
            </h1>
            <p className="text-lg leading-8 text-[var(--text-muted)]">
              We&apos;ll send a one-time code if the account exists and uses password sign-in.
            </p>
          </div>

          {message ? <Notice tone="success">{message}</Notice> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="forgot-email">Email</Label>
              <TextInput
                id="forgot-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@mirrormates.com"
                required
              />
            </div>

            <Button className="w-full" disabled={pending}>
              {pending ? "Sending code..." : "Send reset code"}
            </Button>
          </form>

          <Link href="/" className="text-sm font-bold underline">
            Back to home
          </Link>
        </div>
      </Panel>
    </main>
  );
}
