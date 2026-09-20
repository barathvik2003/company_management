'use client';

import { useState } from 'react';
import type { Paginated } from '@cms/shared';
import { api } from '@/lib/api';
import useRequest from '@/lib/use-request';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge } from '@/components/status-badge';

interface DepartmentRow {
  id: string;
  name: string;
  code: string;
  status: string;
  manager: { firstName: string; lastName: string } | null;
  _count: { employees: number };
}

export default function DepartmentsPage() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useRequest<Paginated<DepartmentRow>>(
    () => api<Paginated<DepartmentRow>>(`/departments?page=${page}&pageSize=20&sortBy=name&sortOrder=asc`),
    [page],
  );

  const columns: Column<DepartmentRow>[] = [
    { key: 'name', header: 'Department', render: (row) => <span className="font-medium">{row.name}</span> },
    { key: 'code', header: 'Code', render: (row) => row.code },
    {
      key: 'manager',
      header: 'Manager',
      render: (row) => (row.manager ? `${row.manager.firstName} ${row.manager.lastName}` : 'Not assigned'),
    },
    { key: 'people', header: 'People', numeric: true, render: (row) => row._count.employees },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <StatusBadge tone={row.status === 'ACTIVE' ? 'ok' : 'neutral'}>
          {row.status.toLowerCase()}
        </StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Departments</h1>
        <p className="mt-1 text-sm text-muted">
          A department with no manager has nobody reviewing its targets or weekly updates.
        </p>
      </div>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        onRetry={reload}
        empty={{
          title: 'No departments yet',
          description: 'Create departments first, then assign employees and a manager to each.',
        }}
        page={data?.page ?? page}
        pageSize={data?.pageSize ?? 20}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
