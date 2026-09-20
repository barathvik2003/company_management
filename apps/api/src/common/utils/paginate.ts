import { Paginated } from '@cms/shared';

export function paginate<T>(items: T[], total: number, page: number, pageSize: number): Paginated<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: pageSize > 0 ? Math.ceil(total / pageSize) : 0,
  };
}

/** Guards against `?sortBy=passwordHash` and similar. */
export function safeSort(
  sortBy: string | undefined,
  allowed: readonly string[],
  fallback: string,
): string {
  return sortBy && allowed.includes(sortBy) ? sortBy : fallback;
}
