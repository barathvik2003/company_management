'use client';

import Link from 'next/link';
import { api } from '@/lib/api';
import useRequest from '@/lib/use-request';
import { LoadingRows, ErrorState } from '@/components/states';
import { StatusBadge, toneForUserStatus } from '@/components/status-badge';

interface EmployeeSummary {
  employee: {
    id: string;
    employeeCode: string;
    designation: string | null;
    employmentStatus: string;
    location: string | null;
    joiningDate: string | null;
    user: { firstName: string; lastName: string; email: string; phone: string | null; status: string;
      roles: Array<{ role: { name: string; label: string } }> };
    department: { name: string } | null;
    reportsTo: { firstName: string; lastName: string } | null;
  };
  recentActivity: Array<{ id: string; action: string; entity: string; summary: string; createdAt: string }>;
}

export default function EmployeeProfilePage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { data, loading, error, reload } = useRequest<EmployeeSummary>(
    () => api<EmployeeSummary>(`/employees/${id}/summary`),
    [id],
  );

  if (loading) return <div className="panel"><LoadingRows /></div>;
  if (error || !data) return <div className="panel"><ErrorState message={error ?? 'Not found'} onRetry={reload} /></div>;

  const { employee, recentActivity } = data;
  const facts: Array<[string, string]> = [
    ['Employee ID', employee.employeeCode],
    ['Department', employee.department?.name ?? '—'],
    ['Designation', employee.designation ?? '—'],
    ['Reports to', employee.reportsTo ? `${employee.reportsTo.firstName} ${employee.reportsTo.lastName}` : '—'],
    ['Email', employee.user.email],
    ['Phone', employee.user.phone ?? '—'],
    ['Location', employee.location ?? '—'],
    ['Joined', employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString() : '—'],
    ['Employment', employee.employmentStatus.toLowerCase()],
    ['Roles', employee.user.roles.map((r) => r.role.label).join(', ')],
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/employees" className="text-sm text-accent hover:underline">← All employees</Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold">
            {employee.user.firstName} {employee.user.lastName}
          </h1>
          <StatusBadge tone={toneForUserStatus(employee.user.status)}>
            {employee.user.status.toLowerCase()}
          </StatusBadge>
        </div>
      </div>

      <section className="panel p-5">
        <h2 className="text-base font-semibold">Details</h2>
        <dl className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="panel p-5">
        <h2 className="text-base font-semibold">Recent activity</h2>
        {recentActivity.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Nothing recorded yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line text-sm">
            {recentActivity.map((entry) => (
              <li key={entry.id} className="flex flex-wrap justify-between gap-2 py-2">
                <span>{entry.summary}</span>
                <time className="text-muted" dateTime={entry.createdAt}>
                  {new Date(entry.createdAt).toLocaleString()}
                </time>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="text-base font-semibold">Targets, sales and tasks</h2>
        <p className="mt-2 text-sm text-muted">
          These sections turn on in Phase 2 (sales and targets) and Phase 4 (projects and tasks).
          The page is built to hold them so nothing moves when they arrive.
        </p>
      </section>
    </div>
  );
}
