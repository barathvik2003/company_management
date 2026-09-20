import type { SessionUser } from '@cms/shared';

export function can(user: SessionUser | null, permission: string): boolean {
  return Boolean(user?.permissions.some((p) => p.key === permission));
}

export function scopeFor(user: SessionUser | null, permission: string): string | null {
  return user?.permissions.find((p) => p.key === permission)?.scope ?? null;
}

export function initials(user: SessionUser): string {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}
