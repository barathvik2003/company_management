'use client';

import { LoadingRows, EmptyState, ErrorState } from './states';

export interface Column<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  /** Right-align numeric columns. */
  numeric?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  empty: { title: string; description: string; action?: React.ReactNode };
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function DataTable<T>({
  columns, rows, rowKey, loading, error, onRetry, empty, page, pageSize, total, onPageChange,
}: DataTableProps<T>) {
  const totalPages = pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1;

  if (loading) return <div className="panel"><LoadingRows /></div>;
  if (error) return <div className="panel"><ErrorState message={error} onRetry={onRetry} /></div>;
  if (rows.length === 0) return <div className="panel"><EmptyState {...empty} /></div>;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="panel overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-line bg-canvas/60 text-left">
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 font-semibold text-muted ${column.numeric ? 'text-right' : ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line/70 last:border-0 hover:bg-canvas/50">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-3 ${column.numeric ? 'text-right tabular' : ''}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3 text-sm">
        <p className="text-muted">
          Showing {from}–{to} of {total}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="btn-secondary px-3 py-1.5"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
          >
            Previous
          </button>
          <span className="text-muted">Page {page} of {totalPages}</span>
          <button
            type="button"
            className="btn-secondary px-3 py-1.5"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
