'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Paginated } from '@cms/shared';
import { api } from '@/lib/api';
import useRequest from '@/lib/use-request';
import { DataTable, type Column } from '@/components/data-table';
import { StatusBadge, toneForUserStatus } from '@/components/status-badge';

interface EmployeeRow {
  id: string;
  employeeCode: string;
  designation: string | null;
  employmentStatus: string;
  user: { id: string; firstName: string; lastName: string; email: string; status: string };
  department: { id: string; name: string } | null;
}

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');

  const { data, loading, error, reload } = useRequest<Paginated<EmployeeRow>>(
    () =>
      api<Paginated<EmployeeRow>>(
        `/employees?page=${page}&pageSize=20${query ? `&search=${encodeURIComponent(query)}` : ''}`,
      ),
    [page, query],
  );

  const columns: Column<EmployeeRow>[] = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => (
        <Link href={`/employees/${row.id}`} className="font-medium text-accent hover:underline">
          {row.user.firstName} {row.user.lastName}
        </Link>
      ),
    },
    { key: 'code', header: 'Employee ID', render: (row) => row.employeeCode },
    { key: 'dept', header: 'Department', render: (row) => row.department?.name ?? '—' },
    { key: 'designation', header: 'Designation', render: (row) => row.designation ?? '—' },
    { key: 'email', header: 'Email', render: (row) => row.user.email },
    {
      key: 'status',
      header: 'Account',
      render: (row) => (
        <StatusBadge tone={toneForUserStatus(row.user.status)}>{row.user.status.toLowerCase()}</StatusBadge>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Employees</h1>
          <p className="mt-1 text-sm text-muted">
            Everyone you can see. Managers see their own department; company heads see all.
          </p>
        </div>
      </div>

      <form
        className="flex flex-wrap gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setPage(1);
          setQuery(search);
        }}
      >
        <label htmlFor="employee-search" className="sr-only">Search employees</label>
        <input
          id="employee-search"
          className="field-input max-w-xs"
          placeholder="Name, email or employee ID"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />
        <button type="submit" className="btn-secondary">Search</button>
        {query ? (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => { setSearch(''); setQuery(''); setPage(1); }}
          >
            Clear
          </button>
        ) : null}
      </form>

      <DataTable
        columns={columns}
        rows={data?.items ?? []}
        rowKey={(row) => row.id}
        loading={loading}
        error={error}
        onRetry={reload}
        empty={{
          title: query ? 'No one matches that search' : 'No employees yet',
          description: query
            ? 'Try a different name, email or employee ID.'
            : 'Add your first employee to start tracking targets and tasks.',
        }}
        page={data?.page ?? page}
        pageSize={data?.pageSize ?? 20}
        total={data?.total ?? 0}
        onPageChange={setPage}
      />
    </div>
  );
}
