import type { ApiResponse } from '@cms/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
    readonly details?: Record<string, string[]>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

/**
 * The only way the browser talks to the backend.
 *
 * `credentials: 'include'` sends the httpOnly auth cookies; the app never sees
 * the tokens themselves, so an XSS bug cannot read them.
 */
export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(`${BASE_URL}/api${path}`, {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    signal: options.signal,
    cache: 'no-store',
  });

  let payload: ApiResponse<T> | null = null;
  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError('The server sent an unreadable response.', 'BAD_RESPONSE', response.status);
  }

  if (!response.ok || payload.success === false) {
    const failure = payload.success === false ? payload : null;
    throw new ApiError(
      failure?.message ?? 'The request could not be completed.',
      failure?.code ?? 'REQUEST_FAILED',
      response.status,
      failure?.details,
    );
  }

  return payload.data;
}
