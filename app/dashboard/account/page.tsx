"use client";

import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { useToast } from "@/components/providers/toast-provider";
import { AuthGuard } from "@/components/ui/auth-guard";
import {
  Button,
  Label,
  Notice,
  Panel,
  TextInput,
} from "@/components/ui/primitives";
import { extractErrorMessage } from "@/lib/api";

function AccountPasswordExperience() {
  const { user, changePassword } = useAuth();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);

    try {
      await changePassword(form);
      setForm({
        currentPassword: "",
        newPassword: "",
      });
      showToast({
        message: "Password changed. All older refresh sessions were revoked.",
        tone: "success",
      });
    } catch (passwordError) {
      showToast({
        message: extractErrorMessage(passwordError),
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
            <div className="section-kicker">Account security</div>
            <h1 className="font-[var(--font-display)] text-5xl tracking-[-0.05em]">
              Change your password.
            </h1>
            <p className="text-lg leading-8 text-[var(--text-muted)]">
              Updating it revokes your older refresh sessions automatically.
            </p>
          </div>

          {user?.hasPasswordLogin ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="current-password">Current password</Label>
                <TextInput
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  value={form.currentPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      currentPassword: event.target.value,
                    }))
                  }
                  required
                  minLength={8}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new-password" hint="Use at least 8 characters.">
                  New password
                </Label>
                <TextInput
                  id="new-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.newPassword}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      newPassword: event.target.value,
                    }))
                  }
                  required
                  minLength={8}
                />
              </div>

              <div className="flex flex-wrap gap-3">
                <Button className="min-w-44" disabled={pending}>
                  {pending ? "Updating password..." : "Change password"}
                </Button>
              </div>
            </form>
          ) : (
            <Notice tone="warning">
              This account uses Google sign-in, so there is no password to
              change here.
            </Notice>
          )}

          <Link href="/dashboard" className="text-sm font-bold underline">
            Back to dashboard
          </Link>
        </div>
      </Panel>
    </main>
  );
}

export default function DashboardAccountPage() {
  return (
    <AuthGuard>
      <AccountPasswordExperience />
    </AuthGuard>
  );
}
