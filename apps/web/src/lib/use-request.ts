'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from './api';

interface RequestState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  reload: () => void;
}

/**
 * A small fetch-on-mount hook. Deliberately not a caching library: Phase 1 has
 * few screens, and adding one is easy later if the need appears.
 */
export default function useRequest<T>(fetcher: () => Promise<T>, deps: unknown[] = []): RequestState<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(fetcher, deps);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    run()
      .then((result) => {
        if (!cancelled) setData(result);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof ApiError ? err.message : 'Could not reach the server.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [run, nonce]);

  return { data, error, loading, reload: () => setNonce((value) => value + 1) };
}
