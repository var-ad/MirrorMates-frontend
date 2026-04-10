"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, Label, Notice, Panel, TextInput } from "@/components/ui/primitives";
import { extractErrorMessage } from "@/lib/api";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifySignup } = useAuth();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);

    try {
      await verifySignup({ email, otp });
      setMessage("Email verified. Entering your dashboard now.");
      router.push("/dashboard");
    } catch (verificationError) {
      setError(extractErrorMessage(verificationError));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
      <Panel paper className="w-full max-w-2xl">
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="section-kicker">Verify signup</div>
            <h1 className="font-[var(--font-display)] text-5xl tracking-[-0.05em]">
              Open your inbox, then bring the code back here.
            </h1>
            <p className="text-lg leading-8 text-[rgba(25,20,16,0.72)]">
              MirrorMates only creates the account after the 6-digit OTP is confirmed.
            </p>
          </div>

          {message ? <Notice tone="success">{message}</Notice> : null}
          {error ? <Notice tone="danger">{error}</Notice> : null}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="verify-email">Email</Label>
              <TextInput
                id="verify-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="verify-otp">6-digit code</Label>
              <TextInput
                id="verify-otp"
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value)}
                placeholder="000000"
                required
              />
            </div>

            <Button className="w-full" disabled={pending}>
              {pending ? "Verifying..." : "Verify email and continue"}
            </Button>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[rgba(25,20,16,0.72)]">
            <Link href="/" className="font-bold underline">
              Back to home
            </Link>
            <span>Need a fresh code? Sign up again with the same email.</span>
          </div>
        </div>
      </Panel>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense
      fallback={
        <main className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
          <Panel paper className="w-full max-w-2xl text-center">
            <p className="section-kicker justify-center">Verify signup</p>
            <h1 className="mt-4 font-[var(--font-display)] text-4xl tracking-[-0.04em]">
              Loading verification details...
            </h1>
          </Panel>
        </main>
      }
    >
      <VerifyPageContent />
    </Suspense>
  );
}
