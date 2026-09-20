'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/session';
import { ApiError } from '@/lib/api';

export default function LoginPage() {
  const { signIn, user, loading } = useSession();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace('/dashboard');
  }, [loading, user, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not reach the server. Check your connection.',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main id="main" className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="hidden flex-col justify-between bg-accent p-12 text-white lg:flex">
        <p className="text-sm font-semibold tracking-wide text-white/70">Company Management System</p>
        <div className="max-w-md">
          <h1 className="text-4xl font-semibold leading-tight">
            One place to see what the company is actually doing today.
          </h1>
          <p className="mt-4 text-white/80">
            Targets against real sales, why deals are stuck, which projects slipped, and what the
            numbers say you should look at first.
          </p>
        </div>
        <p className="text-sm text-white/60">
          Monitor → understand → identify → suggest → approve → act → track
        </p>
      </section>

      <section className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-1 text-sm text-muted">Use the account your administrator gave you.</p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
            {error ? (
              <p role="alert" className="rounded-card border border-risk/30 bg-risk-soft px-3 py-2 text-sm text-risk">
                {error}
              </p>
            ) : null}

            <div>
              <label htmlFor="email" className="field-label">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                required
                className="field-input"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="field-label">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="field-input"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className="mt-8 text-xs text-muted">
            Demo accounts: head@demo.local, manager@demo.local, employee@demo.local,
            finance@demo.local — password Demo@Pass123
          </p>
        </div>
      </section>
    </main>
  );
}
