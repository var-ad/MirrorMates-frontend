"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, Label, Notice, Panel, TextInput } from "@/components/ui/primitives";
import { extractErrorMessage } from "@/lib/api";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      const result = await resetPassword({ email, otp, newPassword });
      setMessage(result.message);
    } catch (resetError) {
      setError(extractErrorMessage(resetError));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
      <Panel className="w-full max-w-xl">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="section-kicker">Reset password</div>
            <h1 className="font-[var(--font-display)] text-5xl tracking-[-0.05em]">
              Trade the code for a fresh password.
            </h1>
            <p className="text-lg leading-8 text-[var(--text-muted)]">
              Enter the OTP from your email, then choose a new password.
            </p>
          </div>

          {message ? <Notice tone="success">{message}</Notice> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <TextInput
                id="reset-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-otp">OTP code</Label>
              <TextInput
                id="reset-otp"
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="000000"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reset-password">New password</Label>
              <TextInput
                id="reset-password"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="At least 8 characters"
                required
              />
            </div>

            <Button className="w-full" disabled={pending}>
              {pending ? "Resetting..." : "Reset password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
          <Panel className="w-full max-w-xl text-center">
            <p className="section-kicker justify-center">Reset password</p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl tracking-[-0.04em]">
              Loading reset form...
            </h1>
          </Panel>
        </main>
      }
    >
      <ResetPasswordPageContent />
    </Suspense>
  );
}
