// src/pages/TradesPage.tsx
import { useTrades } from '../hooks/useData';
import { format } from 'date-fns';
import {
  ColumnDef,
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { ClipboardCopy, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

const COINGECKO_API =
  'https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd';

type Trade = {
  token_mint: string;
  enriched?: {
    name?: string;
    symbol?: string;
  };
  buy_price: number;
  sell_price: number;
  price_change_percent: number;
  estimated_profit_sol: number;
  buy_timestamp: string | null;
  sell_timestamp: string | null;
  token_amount_sold?: string;
  decimals?: number;
};

function TradesPage() {
  const [copiedMint, setCopiedMint] = useState<string | null>(null);

  const {
    data: rawData = [],
    isLoading: tradesLoading,
    error: tradesError,
  } = useTrades();

  const data: Trade[] = rawData;

  const {
    data: solPrice = 0,
    isLoading: priceLoading,
    error: priceError,
  } = useQuery<number>({
    queryKey: ['sol_usd_price'],
    queryFn: async () => {
      const res = await fetch(COINGECKO_API);
      const json = await res.json();
      return json.solana?.usd || 0;
    },
    refetchInterval: 60000,
  });

  const handleCopy = async (mint: string) => {
    await navigator.clipboard.writeText(mint);
    setCopiedMint(mint);
    setTimeout(() => setCopiedMint(null), 1500);
  };

  const columnHelper = createColumnHelper<Trade>();

  const columns: ColumnDef<Trade>[] = [
    columnHelper.accessor('token_mint', {
      header: '🧬 Token',
      cell: ({ row }) => {
        const mint = row.original.token_mint;
        const name = row.original.enriched?.name || 'Unknown';
        return (
          <div className="flex items-center gap-2">
            <a
              href={`/insights/${mint}`}
              className="link link-hover text-primary font-medium truncate max-w-[140px]"
              title={name}
            >
              {name}
            </a>
            <button
              className="btn btn-xs btn-ghost p-1"
              onClick={() => handleCopy(mint)}
              title="Copy token mint"
            >
              {copiedMint === mint ? (
                <CheckCircle2 className="w-4 h-4 text-success" />
              ) : (
                <ClipboardCopy className="w-4 h-4 opacity-70" />
              )}
            </button>
          </div>
        );
      },
    }),
    columnHelper.accessor((row) => row.enriched?.symbol ?? '—', {
      id: 'symbol',
      header: 'Symbol',
      cell: (info) => (
        <span className="text-sm font-mono">{info.getValue()}</span>
      ),
    }),
    columnHelper.accessor('buy_price', {
      header: 'Buy (USD)',
      cell: ({ getValue }) => {
        const val = getValue() || 0;
        const usd = val * solPrice;
        return usd > 0 ? `$${usd.toFixed(6)}` : '—';
      },
    }),
    columnHelper.accessor('sell_price', {
      header: 'Sell (USD)',
      cell: ({ getValue }) => {
        const val = getValue() || 0;
        const usd = val * solPrice;
        return usd > 0 ? `$${usd.toFixed(6)}` : '—';
      },
    }),
    columnHelper.accessor('price_change_percent', {
      header: 'Change',
      cell: ({ getValue }) => {
        const change = getValue() || 0;
        const emoji = change > 0 ? '🚀' : change < 0 ? '💀' : '';
        const color =
          change > 0
            ? 'text-green-500'
            : change < 0
            ? 'text-red-500'
            : 'text-base-content';
        return (
          <span className={`font-medium ${color}`}>
            {emoji} {change.toFixed(2)}%
          </span>
        );
      },
    }),
    columnHelper.accessor('estimated_profit_sol', {
      header: 'Profit',
      cell: ({ getValue }) => {
        const sol = getValue() || 0;
        const usd = sol * solPrice;
        const emoji = usd > 0 ? '🟢' : usd < 0 ? '🔴' : '';
        const color =
          usd > 0
            ? 'text-green-500'
            : usd < 0
            ? 'text-red-500'
            : 'text-base-content';
        return (
          <span className={`font-semibold ${color}`}>
            {emoji} {usd !== 0 ? `$${usd.toFixed(6)}` : '—'}
          </span>
        );
      },
    }),
    columnHelper.accessor('buy_timestamp', {
      header: 'Buy Time',
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? format(new Date(value), 'PP p') : '—';
      },
    }),
    columnHelper.accessor('sell_timestamp', {
      header: 'Sell Time',
      cell: ({ getValue }) => {
        const value = getValue();
        return value ? format(new Date(value), 'PP p') : '—';
      },
    }),
    columnHelper.accessor('token_amount_sold', {
      header: 'Tokens Sold',
      cell: ({ getValue }) => getValue() ?? '—',
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
      <h1 className="text-3xl font-bold">💸 Trade History</h1>
      {(tradesLoading || priceLoading) && (
        <div className="text-center py-8">
          <span className="loading loading-spinner text-primary" />
        </div>
      )}
      {(tradesError || priceError) && (
        <div className="alert alert-error">
          Failed to load trades or SOL price.
        </div>
      )}
      {!tradesLoading && !tradesError && !priceLoading && !priceError && (
        <div className="overflow-x-auto rounded-xl border border-base-300 bg-base-100 shadow">
          <table className="table table-sm w-full">
            <thead className="bg-base-200 text-sm sticky top-0 z-10">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id} className="px-4 py-2">
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
            <tbody className="text-sm">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-base-200 transition">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-2 whitespace-nowrap">
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
