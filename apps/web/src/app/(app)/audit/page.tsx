'use client';

import { useState } from 'react';
import type { Paginated } from '@cms/shared';
import { api } from '@/lib/api';
import useRequest from '@/lib/use-request';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';

interface AuditRow {
  id: string;
  action: string;
  entity: string;
  summary: string;
  actorEmail: string | null;
  ipAddress: string | null;
  createdAt: string;
}

function toneFor(action: string) {
  if (action === 'LOGIN_FAILED') return 'risk' as const;
  if (action === 'ROLE_CHANGE' || action === 'STATUS_CHANGE') return 'warn' as const;
  if (action === 'LOGIN' || action === 'LOGOUT') return 'info' as const;
  return 'neutral' as const;
}

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useRequest<Paginated<AuditRow>>(
    () => api<Paginated<AuditRow>>(`/audit-logs?page=${page}&pageSize=25`),
    [page],
  );

  const columns: Column<AuditRow>[] = [
    {
      key: 'when',
      header: 'When',
      render: (row) => (
        <time dateTime={row.createdAt}>{new Date(row.createdAt).toLocaleString()}</time>
      ),
    },
    { key: 'who', header: 'Who', render: (row) => row.actorEmail ?? 'System' },
    {
      key: 'action',
      header: 'Action',
      render: (row) => <StatusBadge tone={toneFor(row.action)}>{row.action.replace('_', ' ').toLowerCase()}</StatusBadge>,
    },
    { key: 'what', header: 'What happened', render: (row) => row.summary },
    { key: 'ip', header: 'IP', render: (row) => row.ipAddress ?? '—' },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Audit log</h1>
        <p className="mt-1 text-sm text-muted">
          Every sign-in, role change and record change. Passwords and tokens are never recorded.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        onRetry={reload}
        empty={{ title: 'Nothing logged yet', description: 'Activity appears here as people use the system.' }}
        page={data?.page ?? page}
        pageSize={data?.pageSize ?? 25}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
