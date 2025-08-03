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
      cell: ({ getValue }) => (
        <span className="badge badge-outline badge-info">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'message',
      header: '📝 Message',
      cell: ({ getValue }) => (
        <div className="text-sm break-words whitespace-pre-wrap">{getValue()}</div>
      ),
    },
    {
      accessorKey: 'token_mint',
      header: '🧬 Token Mint',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono opacity-80">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'sig',
      header: '🔏 Sig',
      cell: ({ getValue }) => (
        <span className="text-xs font-mono text-accent">{getValue()}</span>
      ),
    },
    {
      accessorKey: 'data',
      header: '📦 Data',
      cell: ({ getValue }) => (
        <details className="collapse collapse-arrow text-xs bg-base-200 rounded-lg">
          <summary className="collapse-title text-sm font-semibold cursor-pointer">
            View Data
          </summary>
          <div className="collapse-content max-h-48 overflow-auto">
            <pre className="whitespace-pre-wrap break-all">
              {JSON.stringify(getValue(), null, 2)}
            </pre>
          </div>
        </details>
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🧠 Bot Logs</h1>
        <input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(String(e.target.value))}
          className="input input-bordered w-full max-w-sm"
          placeholder="Search logs globally..."
        />
      </div>

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
