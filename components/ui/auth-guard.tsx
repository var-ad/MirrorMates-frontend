"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/auth-provider";
import { Button, Panel } from "@/components/ui/primitives";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isReady, isAuthenticated } = useAuth();

  if (!isReady) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
        <Panel className="max-w-xl text-center">
          <p className="section-kicker justify-center">Loading session</p>
          <h1 className="mt-5 font-[var(--font-display)] text-4xl tracking-[-0.04em]">
            Pulling your reflection space back into focus.
          </h1>
        </Panel>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="page-shell flex min-h-screen items-center justify-center px-6 py-16">
        <Panel className="max-w-xl space-y-6 text-center">
          <p className="section-kicker justify-center">Members only</p>
          <h1 className="font-[var(--font-display)] text-4xl tracking-[-0.04em]">
            You need to sign in before opening your MirrorMates dashboard.
          </h1>
          <p className="text-lg leading-8 text-[var(--text-muted)]">
            Head back to the launch page, sign in, and we&apos;ll bring you straight
            into your sessions.
          </p>
          <Link href="/">
            <Button className="mx-auto">Return to home</Button>
          </Link>
        </Panel>
      </div>
    );
  }

  return <>{children}</>;
}
