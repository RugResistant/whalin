import { useTrades } from '@/hooks/useData';
import { format } from 'date-fns';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

function TradesPage() {
  const { data = [], isLoading, error } = useTrades();

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'token_mint',
      header: '🧬 Token Mint',
      cell: ({ getValue }) => (
        <a
          href={`/insights/${getValue<string>()}`}
          className="link link-primary break-all"
        >
          {getValue<string>()}
        </a>
      ),
    },
    {
      accessorFn: (row) => row.enriched?.name ?? 'Unknown',
      header: 'Name',
    },
    {
      accessorFn: (row) => row.enriched?.symbol ?? '—',
      header: 'Symbol',
    },
    {
      accessorKey: 'buy_price',
      header: 'Buy Price (SOL)',
      cell: ({ getValue }) => {
        const val = Number(getValue());
        return val > 0 ? `${val.toFixed(6)}◎` : '—';
      },
    },
    {
      accessorKey: 'buy_timestamp',
      header: 'Buy Time',
      cell: ({ getValue }) =>
        getValue() ? format(new Date(getValue<string>()), 'PP p') : '—',
    },
    {
      accessorKey: 'sell_price',
      header: 'Sell Price (SOL)',
      cell: ({ getValue }) => {
        const val = Number(getValue());
        return val > 0 ? `${val.toFixed(6)}◎` : '—';
      },
    },
    {
      accessorKey: 'sell_timestamp',
      header: 'Sell Time',
      cell: ({ getValue }) =>
        getValue() ? format(new Date(getValue<string>()), 'PP p') : '—',
    },
    {
      accessorKey: 'price_change_percent',
      header: 'Change (%)',
      cell: ({ getValue }) =>
        getValue() ? `${Number(getValue()).toFixed(2)}%` : '—',
    },
    {
      accessorKey: 'estimated_profit_sol',
      header: 'Profit (SOL)',
      cell: ({ getValue }) => {
        const val = Number(getValue());
        return val ? `${val.toFixed(6)}◎` : '—';
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <h1 className="text-3xl font-bold">💸 Trade History</h1>

      {isLoading && <div className="loading loading-spinner text-primary" />}
      {error && <div className="alert alert-error">Failed to load trades.</div>}

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

export default TradesPage;
