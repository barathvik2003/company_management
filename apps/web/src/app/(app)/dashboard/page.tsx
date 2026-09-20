'use client';

import useRequest from '@/lib/use-request';
import { api } from '@/lib/api';
import { useSession } from '@/lib/session';
import { Metric } from '@/components/metric';
import { EmptyState, ErrorState, LoadingRows } from '@/components/states';
import type { Paginated } from '@cms/shared';

interface EmployeeRow {
  id: string;
  employeeCode: string;
  user: { firstName: string; lastName: string; status: string; lastLoginAt: string | null };
  department: { name: string } | null;
}

export default function DashboardPage() {
  const { user } = useSession();
  const { data, error, loading, reload } = useRequest(() =>
    api<Paginated<EmployeeRow>>('/employees?pageSize=100'),
  );

  const employees = data?.items ?? [];
  const active = employees.filter((e) => e.user.status === 'ACTIVE').length;
  const neverSignedIn = employees.filter((e) => !e.user.lastLoginAt).length;
  const departments = new Set(employees.map((e) => e.department?.name).filter(Boolean)).size;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Good to see you, {user?.firstName}</h1>
        <p className="mt-1 text-sm text-muted">
          Phase 1 is live: people, departments and access. Sales, projects and finance arrive in the
          next phases.
        </p>
      </div>

      {/*
        The action centre leads, not the metric strip: the product exists to
        show what needs attention, not to display totals.
      */}
      <section aria-labelledby="attention" className="panel p-5">
        <h2 id="attention" className="text-base font-semibold">Needs your attention</h2>
        {loading ? (
          <LoadingRows rows={2} />
        ) : error ? (
          <ErrorState message={error} onRetry={reload} />
        ) : neverSignedIn > 0 ? (
          <ul className="mt-3 space-y-2 text-sm">
            <li className="flex items-start gap-2">
              <span aria-hidden="true" className="mt-1 text-warn">▲</span>
              <span>
                <strong>{neverSignedIn}</strong> {neverSignedIn === 1 ? 'account has' : 'accounts have'}{' '}
                never been used. Chase the first sign-in so their targets and updates start flowing.
              </span>
            </li>
          </ul>
        ) : (
          <EmptyState
            title="Nothing is waiting on you"
            description="Every account is active and in use. Come back once sales data starts arriving."
          />
        )}
      </section>

      <section aria-labelledby="numbers" className="space-y-3">
        <h2 id="numbers" className="text-base font-semibold">Where things stand</h2>
        {loading ? (
          <div className="panel"><LoadingRows rows={2} /></div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Metric label="People on the system" value={data?.total ?? 0} />
            <Metric label="Active accounts" value={active} note={`${employees.length - active} inactive`} />
            <Metric label="Departments with staff" value={departments} />
            <Metric label="Never signed in" value={neverSignedIn} />
          </div>
        )}
      </section>
    </div>
  );
}
