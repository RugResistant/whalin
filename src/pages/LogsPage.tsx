// src/pages/LogsPage.tsx
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
    { accessorKey: 'type', header: '📁 Type' },
    { accessorKey: 'message', header: '📝 Message' },
    { accessorKey: 'token_mint', header: '🧬 Token Mint' },
    { accessorKey: 'sig', header: '🔏 Sig' },
    {
      accessorKey: 'data',
      header: '📦 Data',
      cell: ({ getValue }) => (
        <pre className="whitespace-pre-wrap text-xs overflow-auto max-h-32">
          {JSON.stringify(getValue(), null, 2)}
        </pre>
      ),
    },
    {
      accessorKey: 'created_at',
      header: '📅 Created At',
      cell: ({ getValue }) =>
        format(new Date(getValue<string>()), 'PPP p'),
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
      <h1 className="text-3xl font-bold">🧠 Bot Logs</h1>

      <input
        value={globalFilter}
        onChange={(e) => setGlobalFilter(String(e.target.value))}
        className="input input-bordered w-full max-w-xl"
        placeholder="Search logs globally..."
      />

      {isLoading && <div className="loading loading-spinner text-primary" />}
      {error && <div className="alert alert-error">Failed to load logs</div>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra table-sm w-full">
            <thead className="bg-base-300 text-sm">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
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