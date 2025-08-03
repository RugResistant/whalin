// src/pages/TradesPage.tsx
import { useTrades } from '@/hooks/useData';
import { format } from 'date-fns';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';

type TradeRow = {
  token_mint: string;
  enriched?: {
    name?: string;
    symbol?: string;
  };
  buy_price?: number;
  buy_timestamp?: string;
  sell_price?: number;
  sell_timestamp?: string;
  price_change_percent?: number;
  estimated_profit_sol?: number;
};

export default function TradesPage() {
  const { data = [], isLoading, error } = useTrades();

  const columns: ColumnDef<TradeRow>[] = [
    {
      accessorKey: 'token_mint',
      header: '🧬 Token Mint',
      cell: ({ getValue }) => {
        const mint = getValue<string>();
        return (
          <a
            href={`/insights/${mint}`}
            className="link link-primary break-words text-xs"
          >
            {mint}
          </a>
        );
      },
    },
    {
      accessorFn: (row) => row.enriched?.name ?? 'Unknown',
      id: 'name',
      header: 'Name',
    },
    {
      accessorFn: (row) => row.enriched?.symbol ?? '—',
      id: 'symbol',
      header: 'Symbol',
    },
    {
      accessorKey: 'buy_price',
      header: 'Buy (◎)',
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
      header: 'Sell (◎)',
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
      header: 'Δ (%)',
      cell: ({ getValue }) =>
        getValue() ? `${Number(getValue()).toFixed(2)}%` : '—',
    },
    {
      accessorKey: 'estimated_profit_sol',
      header: 'PnL (◎)',
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
      {error && (
        <div className="alert alert-error">Failed to load trades.</div>
      )}

      {!isLoading && !error && (
        <div className="overflow-x-auto rounded-lg border border-base-300 shadow">
          <table className="table table-sm table-zebra w-full text-sm">
            <thead className="bg-base-200">
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id} className="whitespace-nowrap">
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
                    <td key={cell.id} className="whitespace-nowrap">
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
