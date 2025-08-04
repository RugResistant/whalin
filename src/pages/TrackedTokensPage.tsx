import { useTrackedTokens } from '../hooks/useData';
import { format } from 'date-fns';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

function TrackedTokensPage() {
  const { data = [], isLoading, error } = useTrackedTokens({ refetchInterval: 10000 }); // Poll every 10s for real-time
  const {
    data: solPrice = 0,
    isLoading: priceLoading,
  } = useQuery({
    queryKey: ['sol_usd_price'],
    queryFn: async () => {
      const res = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd');
      const json = await res.json();
      return json.solana?.usd || 0;
    },
    refetchInterval: 60000,
  });

  // Fetch latest prices from price_snapshots for all tracked tokens
  const { data: latestPrices = {} } = useQuery({
    queryKey: ['latest_prices', data.map(t => t.token_mint)],
    queryFn: async () => {
      if (!data.length) return {};
      const { data: snapshots } = await supabase
        .from('price_snapshots')
        .select('token_mint, price, captured_at')
        .in('token_mint', data.map(t => t.token_mint))
        .order('captured_at', { ascending: false });
      return snapshots.reduce((acc, snap) => {
        if (!acc[snap.token_mint]) acc[snap.token_mint] = snap.price;
        return acc;
      }, {});
    },
    enabled: !!data.length,
    refetchInterval: 10000, // Real-time poll
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
      cell: ({ getValue }) => getValue<number>().toFixed(10),
    },
    {
      id: 'current_price',
      header: 'Current Price (SOL)',
      cell: ({ row }) => (latestPrices[row.original.token_mint] || 0).toFixed(10),
    },
    {
      id: 'change_percent',
      header: 'Change %',
      cell: ({ row }) => {
        const buy = row.original.buy_price;
        const current = latestPrices[row.original.token_mint] || 0;
        if (!buy || !current) return '—';
        const change = ((current - buy) / buy * 100);
        const color = change > 0 ? 'text-green-500' : 'text-red-500';
        return <span className={color}>{change.toFixed(2)}%</span>;
      },
    },
    {
      id: 'est_pl_sol',
      header: 'Est. P/L (SOL)',
      cell: ({ row }) => {
        const buy = row.original.buy_price;
        const current = latestPrices[row.original.token_mint] || 0;
        if (!buy || !current) return '—';
        const solSpent = 30000000 / 1e9; // From MY_SPEND_LAMPORTS default
        const estTokens = solSpent / buy;
        const pl = estTokens * current - solSpent;
        const color = pl > 0 ? 'text-green-500' : 'text-red-500';
        return <span className={color}>{pl.toFixed(6)}</span>;
      },
    },
    {
      id: 'est_pl_usd',
      header: 'Est. P/L (USD)',
      cell: ({ row }) => {
        const buy = row.original.buy_price;
        const current = latestPrices[row.original.token_mint] || 0;
        if (!buy || !current || priceLoading) return '—';
        const solSpent = 30000000 / 1e9;
        const estTokens = solSpent / buy;
        const plSol = estTokens * current - solSpent;
        const plUsd = plSol * solPrice;
        const color = plUsd > 0 ? 'text-green-500' : 'text-red-500';
        return <span className={color}>${plUsd.toFixed(2)}</span>;
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
