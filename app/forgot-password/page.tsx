"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { Button, Label, Panel, TextInput } from "@/components/ui/primitives";
import { extractErrorMessage } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);

    try {
      const result = await forgotPassword(email);
      showToast({
        message: result.message,
        tone: "success",
      });
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (forgotError) {
      showToast({
        message: extractErrorMessage(forgotError),
        tone: "danger",
      });
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
