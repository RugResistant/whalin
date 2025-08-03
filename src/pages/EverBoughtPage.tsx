// src/pages/EverBoughtPage.tsx
import { useEverBought } from '../hooks/useData';
import { format } from 'date-fns';
import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

function EverBoughtPage() {
  const { data = [], isLoading, error } = useEverBought();

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'token_mint', header: '🧬 Token Mint' },
    {
      accessorKey: 'created_at',
      header: '📅 First Seen',
      cell: ({ getValue }) =>
        format(new Date(getValue<string>()), 'PPP p'),
    },
    {
      accessorKey: 'enriched.name',
      header: '💡 Name',
      cell: ({ row }) => row.original?.enriched?.name || 'Unknown',
    },
    {
      accessorKey: 'enriched.symbol',
      header: '🔠 Symbol',
      cell: ({ row }) => row.original?.enriched?.symbol || 'UNK',
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">🪙 Ever Bought Tokens</h1>

      {isLoading && <div className="loading loading-spinner text-primary" />}
      {error && <div className="alert alert-error">Failed to load ever bought data</div>}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-sm table-zebra w-full">
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

export default EverBoughtPage;