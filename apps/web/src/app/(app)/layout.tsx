'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useSession } from '@/lib/session';
import { can, initials } from '@/lib/permissions';
import { NAV_ITEMS } from './nav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, signOut } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace('/login');
  }, [loading, user, router]);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted" role="status">
        Loading your workspace…
      </div>
    );
  }
  if (!user) return null;

  const items = NAV_ITEMS.filter((item) => !item.permission || can(user, item.permission));

  const nav = (
    <nav aria-label="Main" className="space-y-1">
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        const pending = Boolean(item.phase);
        return (
          <Link
            key={item.href}
            href={pending ? pathname : item.href}
            aria-current={active ? 'page' : undefined}
            aria-disabled={pending}
            className={[
              'flex items-center justify-between rounded-card px-3 py-2 text-sm',
              active ? 'bg-accent-soft font-semibold text-accent-strong' : 'text-ink hover:bg-canvas',
              pending ? 'cursor-not-allowed text-muted hover:bg-transparent' : '',
            ].join(' ')}
            onClick={(event) => {
              if (pending) event.preventDefault();
            }}
          >
            {item.label}
            {pending ? <span className="text-xs text-muted">Phase {item.phase}</span> : null}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="hidden border-r border-line bg-surface lg:flex lg:flex-col">
        <div className="border-b border-line px-4 py-4">
          <p className="text-sm font-semibold leading-tight">Company Management</p>
          <p className="text-xs text-muted">Performance monitoring</p>
        </div>
        <div className="flex-1 overflow-y-auto p-3">{nav}</div>
        <div className="border-t border-line p-3">
          <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
          <p className="text-xs text-muted">{user.roles.join(', ')}</p>
          <button type="button" className="btn-secondary mt-3 w-full py-1.5" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-h-screen flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-line bg-surface px-4 py-3 lg:px-6">
          <button
            type="button"
            className="btn-secondary px-3 py-1.5 lg:hidden"
            aria-expanded={navOpen}
            aria-controls="mobile-nav"
            onClick={() => setNavOpen((open) => !open)}
          >
            Menu
          </button>
          <p className="hidden text-sm text-muted lg:block">
            Signed in as {user.email}
          </p>
          <span
            aria-hidden="true"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-soft text-sm font-semibold text-accent-strong"
          >
            {initials(user)}
          </span>
        </header>

        {navOpen ? (
          <div id="mobile-nav" className="border-b border-line bg-surface p-3 lg:hidden">
            {nav}
            <button type="button" className="btn-secondary mt-3 w-full py-1.5" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        ) : null}

        <main id="main" className="flex-1 px-4 py-6 lg:px-6 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
