"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [email, setEmail] = useState("admin@example.com");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    await signIn("credentials", { email, callbackUrl });
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2 text-center">Sign In</h1>
        <p className="text-sm text-[var(--muted-foreground)] mb-8 text-center">
          Demo mode — pick a user to sign in
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-[var(--muted-foreground)] mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-[var(--muted)] border border-[var(--border)] rounded px-3 py-2 text-sm text-[var(--foreground)] focus:outline-none focus:border-[var(--accent)]"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setEmail("admin@example.com")}
              className={`flex-1 text-xs px-3 py-2 rounded border transition-colors ${
                email === "admin@example.com"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Admin User
            </button>
            <button
              type="button"
              onClick={() => setEmail("member@example.com")}
              className={`flex-1 text-xs px-3 py-2 rounded border transition-colors ${
                email === "member@example.com"
                  ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                  : "border-[var(--border)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
            >
              Member User
            </button>
          </div>

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-[var(--accent)] text-[var(--accent-foreground)] rounded px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInForm />
    </Suspense>
  );
}
