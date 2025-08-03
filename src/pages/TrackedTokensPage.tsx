import { useTrackedTokens } from '../hooks/useData';
import { format } from 'date-fns';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

function TrackedTokensPage() {
  const { data = [], isLoading, error } = useTrackedTokens();

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
      accessorFn: (row) => row.enriched?.name || 'Unknown',
      header: 'Name',
    },
    {
      accessorFn: (row) => row.enriched?.symbol || 'UNK',
      header: 'Symbol',
    },
    {
      accessorKey: 'buy_price',
      header: 'Buy Price (SOL)',
      cell: ({ getValue }) => {
        const price = Number(getValue());
        const emoji = price > 1 ? '🟢' : price < 0.01 ? '🔴' : '';
        const color =
          price > 1 ? 'text-green-500' : price < 0.01 ? 'text-red-500' : 'text-base-content';
        return (
          <span className={color}>
            {emoji} {price.toFixed(6)}
          </span>
        );
      },
    },
    {
      accessorKey: 'buy_sig',
      header: 'Buy Signature',
      cell: ({ getValue }) => (
        <a
          href={`https://solscan.io/tx/${getValue<string>()}`}
          target="_blank"
          rel="noopener noreferrer"
          className="link link-secondary break-all"
        >
          {getValue<string>().slice(0, 12)}...
        </a>
      ),
    },
    {
      accessorKey: 'bought_at',
      header: 'Bought At',
      cell: ({ getValue }) =>
        getValue() ? format(new Date(getValue<string>()), 'PPP p') : '—',
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">📊 Currently Tracked Tokens</h1>

      {isLoading && <div className="loading loading-spinner text-primary" />}
      {error && (
        <div className="alert alert-error">Failed to load tracked tokens</div>
      )}

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

export default TrackedTokensPage;
