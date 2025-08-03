import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/TrackedTokensPage.tsx
import { useTrackedTokens } from '../hooks/useData';
import { format } from 'date-fns';
import { flexRender, getCoreRowModel, useReactTable } from '@tanstack/react-table';
function TrackedTokensPage() {
    const { data = [], isLoading, error } = useTrackedTokens();
    const columns = [
        { accessorKey: 'token_mint', header: '🧬 Token Mint' },
        { accessorFn: (row) => row.enriched?.name || 'Unknown', header: 'Name' },
        { accessorFn: (row) => row.enriched?.symbol || 'UNK', header: 'Symbol' },
        {
            accessorKey: 'buy_price',
            header: 'Buy Price (SOL)',
            cell: ({ getValue }) => Number(getValue()).toFixed(4),
        },
        { accessorKey: 'buy_sig', header: 'Buy Signature' },
        {
            accessorKey: 'bought_at',
            header: 'Bought At',
            cell: ({ getValue }) => format(new Date(getValue()), 'PPP p'),
        },
    ];
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
    });
    return (_jsxs("div", { className: "max-w-6xl mx-auto py-8 px-4 space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\uD83D\uDCCA Currently Tracked Tokens" }), isLoading && _jsx("div", { className: "loading loading-spinner text-primary" }), error && _jsx("div", { className: "alert alert-error", children: "Failed to load tracked tokens" }), !isLoading && !error && (_jsx("div", { className: "overflow-x-auto rounded-lg border border-base-300", children: _jsxs("table", { className: "table table-zebra table-sm w-full", children: [_jsx("thead", { className: "bg-base-300 text-sm", children: table.getHeaderGroups().map((group) => (_jsx("tr", { children: group.headers.map((header) => (_jsx("th", { children: header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, group.id))) }), _jsx("tbody", { children: table.getRowModel().rows.map((row) => (_jsx("tr", { children: row.getVisibleCells().map((cell) => (_jsx("td", { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] }) }))] }));
}
export default TrackedTokensPage;
