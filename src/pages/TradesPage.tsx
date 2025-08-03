import { useTrades } from '../hooks/useData';
import { format } from 'date-fns';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

const COINGECKO_API =
  'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

function TradesPage() {
  const {
    data = [],
    isLoading: tradesLoading,
    error: tradesError,
  } = useTrades();

  const {
    data: solPrice = 0,
    isLoading: priceLoading,
    error: priceError,
  } = useQuery({
    queryKey: ['sol_usd_price'],
    queryFn: async () => {
      const res = await fetch(COINGECKO_API);
      const json = await res.json();
      return json.solana?.usd || 0;
    },
    refetchInterval: 60000,
  });

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
      header: 'Buy Price (USD)',
      cell: ({ getValue }) => {
        const val = Number(getValue()) || 0;
        const usd = val * solPrice;
        return usd > 0 ? `$${usd.toFixed(6)}` : '—';
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
      header: 'Sell Price (USD)',
      cell: ({ getValue }) => {
        const val = Number(getValue()) || 0;
        const usd = val * solPrice;
        return usd > 0 ? `$${usd.toFixed(6)}` : '—';
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
      cell: ({ getValue }) => {
        const change = Number(getValue());
        const emoji = change > 0 ? '🚀' : change < 0 ? '💀' : '';
        const color = change > 0 ? 'text-green-500' : change < 0 ? 'text-red-500' : 'text-base-content';
        return (
          <span className={color}>
            {emoji} {isNaN(change) ? '—' : `${change.toFixed(2)}%`}
          </span>
        );
      },
    },
    {
      accessorKey: 'estimated_profit_sol',
      header: 'Profit (USD)',
      cell: ({ getValue }) => {
        const sol = Number(getValue()) || 0;
        const usd = sol * solPrice;
        const emoji = usd > 0 ? '🟢' : usd < 0 ? '🔴' : '';
        const color = usd > 0 ? 'text-green-500' : usd < 0 ? 'text-red-500' : 'text-base-content';
        return (
          <span className={color}>
            {emoji} {usd !== 0 ? `$${usd.toFixed(6)}` : '—'}
          </span>
        );
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

      {(tradesLoading || priceLoading) && (
        <div className="loading loading-spinner text-primary" />
      )}
      {(tradesError || priceError) && (
        <div className="alert alert-error">
          Failed to load trades or SOL price.
        </div>
      )}

      {!tradesLoading && !tradesError && !priceLoading && !priceError && (
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
