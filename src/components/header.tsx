"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-[var(--border)] bg-[var(--background)] px-4 gap-6">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2">
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
        </Link>
        <div className="h-6 w-px bg-[var(--border)]" />
        <Link href="/" className="text-sm font-bold tracking-wide">
          Skills
        </Link>
      </div>

      <nav className="flex items-center gap-4 text-sm">
        <Link
          href="/audits"
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Audits
        </Link>
        <Link
          href="/docs"
          className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        >
          Docs
        </Link>
        {session ? (
          <>
            <Link
              href="/dashboard"
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Dashboard
            </Link>
            <button
              onClick={() => signOut()}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              Sign out
            </button>
          </>
        ) : (
          <button
            onClick={() => signIn()}
            className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Sign in
          </button>
        )}
      </nav>
    </header>
  );
}
