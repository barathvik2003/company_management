'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SessionUser } from '@cms/shared';
import { api, ApiError } from './api';

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const load = useCallback(async () => {
    try {
      setUser(await api<SessionUser>('/auth/me'));
    } catch (error) {
      // An expired access token is normal; try the refresh cookie once.
      if (error instanceof ApiError && error.status === 401) {
        try {
          setUser(await api<SessionUser>('/auth/refresh', { method: 'POST' }));
          return;
        } catch {
          setUser(null);
          return;
        }
      }
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      const session = await api<SessionUser>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setUser(session);
      router.push('/dashboard');
    },
    [router],
  );

  const signOut = useCallback(async () => {
    try {
      await api('/auth/logout', { method: 'POST' });
    } finally {
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  const value = useMemo<SessionState>(
    () => ({ user, loading, signIn, signOut, refresh: load }),
    [user, loading, signIn, signOut, load],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used inside SessionProvider');
  return context;
}
