import { useState } from 'react';
import { useLogs } from '../hooks/useData';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  useReactTable,
} from '@tanstack/react-table';

function LogsPage() {
  const { data = [], isLoading, error } = useLogs();
  const [globalFilter, setGlobalFilter] = useState('');

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'type',
      header: '📁 Type',
      cell: ({ getValue }) => {
        const type = String(getValue() ?? '—');
        return (
          <span className="badge badge-sm badge-outline badge-accent font-mono">
            {type}
          </span>
        );
      },
    },
    {
      accessorKey: 'message',
      header: '📝 Message',
      cell: ({ getValue }) => {
        const message = String(getValue() ?? '');
        return (
          <div className="text-sm whitespace-pre-wrap break-words max-w-md">
            {message}
          </div>
        );
      },
    },
    {
      accessorKey: 'token_mint',
      header: '🧬 Token Mint',
      cell: ({ getValue }) => {
        const mint = String(getValue() ?? '');
        return (
          <span
            className="text-xs font-mono opacity-80 truncate max-w-[160px] inline-block"
            title={mint}
          >
            {mint}
          </span>
        );
      },
    },
    {
      accessorKey: 'sig',
      header: '🔏 Sig',
      cell: ({ getValue }) => {
        const sig = String(getValue() ?? '');
        return (
          <span
            className="text-xs font-mono text-accent truncate max-w-[160px] inline-block"
            title={sig}
          >
            {sig}
          </span>
        );
      },
    },
    {
      accessorKey: 'data',
      header: '📦 Data',
      cell: ({ getValue }) => {
        const val = getValue();
        const json = val ? JSON.stringify(val, null, 2) : 'No data';
        return (
          <details className="collapse collapse-arrow text-xs bg-base-200 rounded-md shadow-sm">
            <summary className="collapse-title text-sm font-semibold cursor-pointer px-2 py-1">
              View Data
            </summary>
            <div className="collapse-content max-h-48 overflow-auto p-2 border-t border-base-300">
              <pre className="whitespace-pre-wrap break-words">{json}</pre>
            </div>
          </details>
        );
      },
    },
    {
      accessorKey: 'created_at',
      header: '📅 Created At',
      cell: ({ getValue }) => {
        const date = getValue<string>();
        return (
          <span className="text-sm text-muted-foreground">
            {date ? format(new Date(date), 'PP p') : '—'}
          </span>
        );
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">🧠 Bot Logs</h1>
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="input input-bordered w-full sm:max-w-sm"
          placeholder="Search logs globally..."
        />
      </div>

      {/* Loading & error */}
      {isLoading && (
        <div className="text-center py-10">
          <span className="loading loading-spinner text-primary" />
        </div>
      )}
      {error && <div className="alert alert-error">Failed to load logs</div>}

      {/* Table */}
      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-xl border border-base-300 shadow bg-base-100">
          <table className="table table-sm w-full">
            <thead className="bg-base-200 sticky top-0 z-10 text-sm">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id} className="px-3 py-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          ) as React.ReactElement | null}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="text-sm">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-base-200 transition">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-3 py-2 align-top">
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      ) as React.ReactElement | null}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default LogsPage;
