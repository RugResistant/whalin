// src/pages/TradesPage.tsx
import { useTrades } from '../hooks/useData';
import { format } from 'date-fns';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';

const COINGECKO_API = 'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

function TradesPage() {
  const { data = [], isLoading: tradesLoading, error: tradesError } = useTrades();
  
  // Fetch current SOL/USD price from CoinGecko
  const { data: solPrice = 0, isLoading: priceLoading, error: priceError } = useQuery({
    queryKey: ['sol_usd_price'],
    queryFn: async () => {
      const res = await fetch(COINGECKO_API);
      const json = await res.json();
      return json.solana?.usd || 0;
    },
    refetchInterval: 60000, // Refetch every minute for semi-real-time updates
  });

  const columns: ColumnDef<any>[] = [
    { accessorKey: 'token_mint', header: '🧬 Token Mint' },
    { accessorFn: (row) => row.enriched?.name || 'Unknown', header: 'Name' },
    { accessorFn: (row) => row.enriched?.symbol || 'UNK', header: 'Symbol' },
    {
      accessorKey: 'buy_price',
      header: 'Buy Price (USD)',
      cell: ({ getValue }) => {
        const valueInSol = Number(getValue()) || 0;
        const valueInUsd = valueInSol * solPrice;
        return valueInUsd > 0 ? `$${valueInUsd.toFixed(12)}` : '—'; // Increased decimals for small values
      },
    },
    {
      accessorKey: 'buy_timestamp',
      header: 'Buy Time',
      cell: ({ getValue }) => format(new Date(getValue<string>()), 'PPP p'),
    },
    {
      accessorKey: 'sell_price',
      header: 'Sell Price (USD)',
      cell: ({ getValue }) => {
        const valueInSol = Number(getValue()) || 0;
        const valueInUsd = valueInSol * solPrice;
        return valueInUsd > 0 ? `$${valueInUsd.toFixed(12)}` : '—';
      },
    },
    {
      accessorKey: 'sell_timestamp',
      header: 'Sell Time',
      cell: ({ getValue }) =>
        getValue() ? format(new Date(getValue<string>()), 'PPP p') : '—',
    },
    {
      accessorKey: 'price_change_percent',
      header: 'Change (%)',
      cell: ({ getValue }) =>
        getValue() ? `${Number(getValue()).toFixed(2)}%` : '—',
    },
    {
      accessorKey: 'estimated_profit_sol',
      header: 'Profit (USD)',
      cell: ({ getValue }) => {
        const valueInSol = Number(getValue()) || 0;
        const valueInUsd = valueInSol * solPrice;
        return valueInUsd > 0 ? `$${valueInUsd.toFixed(12)}` : '—';
      },
    },
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">💸 Trade History</h1>
      {(tradesLoading || priceLoading) && <div className="loading loading-spinner text-primary" />}
      {(tradesError || priceError) && <div className="alert alert-error">Failed to load trades or SOL price</div>}
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
