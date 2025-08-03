import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/TradesPage.tsx
import { useTrades } from '../hooks/useData';
import { format } from 'date-fns';
import { flexRender, getCoreRowModel, useReactTable, } from '@tanstack/react-table';
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
    const columns = [
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
            cell: ({ getValue }) => format(new Date(getValue()), 'PPP p'),
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
            cell: ({ getValue }) => getValue() ? format(new Date(getValue()), 'PPP p') : '—',
        },
        {
            accessorKey: 'price_change_percent',
            header: 'Change (%)',
            cell: ({ getValue }) => getValue() ? `${Number(getValue()).toFixed(2)}%` : '—',
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
    return (_jsxs("div", { className: "max-w-6xl mx-auto py-8 px-4 space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\uD83D\uDCB8 Trade History" }), (tradesLoading || priceLoading) && _jsx("div", { className: "loading loading-spinner text-primary" }), (tradesError || priceError) && _jsx("div", { className: "alert alert-error", children: "Failed to load trades or SOL price" }), !tradesLoading && !tradesError && !priceLoading && !priceError && (_jsx("div", { className: "overflow-x-auto rounded-lg border border-base-300", children: _jsxs("table", { className: "table table-zebra table-sm w-full", children: [_jsx("thead", { className: "bg-base-300 text-sm", children: table.getHeaderGroups().map((group) => (_jsx("tr", { children: group.headers.map((header) => (_jsx("th", { children: header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, group.id))) }), _jsx("tbody", { children: table.getRowModel().rows.map((row) => (_jsx("tr", { children: row.getVisibleCells().map((cell) => (_jsx("td", { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] }) }))] }));
}
export default TradesPage;
