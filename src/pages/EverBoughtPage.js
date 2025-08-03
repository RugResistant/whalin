import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/EverBoughtPage.tsx
import { useEverBought } from '../hooks/useData';
import { format } from 'date-fns';
import { flexRender, getCoreRowModel, useReactTable, } from '@tanstack/react-table';
function EverBoughtPage() {
    const { data = [], isLoading, error } = useEverBought();
    const columns = [
        { accessorKey: 'token_mint', header: '🧬 Token Mint' },
        {
            accessorKey: 'created_at',
            header: '📅 First Seen',
            cell: ({ getValue }) => format(new Date(getValue()), 'PPP p'),
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
    return (_jsxs("div", { className: "max-w-7xl mx-auto py-8 px-4 space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\uD83E\uDE99 Ever Bought Tokens" }), isLoading && _jsx("div", { className: "loading loading-spinner text-primary" }), error && _jsx("div", { className: "alert alert-error", children: "Failed to load ever bought data" }), !isLoading && !error && (_jsx("div", { className: "overflow-x-auto rounded-lg border border-base-300", children: _jsxs("table", { className: "table table-sm table-zebra w-full", children: [_jsx("thead", { className: "bg-base-300 text-sm", children: table.getHeaderGroups().map((group) => (_jsx("tr", { children: group.headers.map((header) => (_jsx("th", { children: header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, group.id))) }), _jsx("tbody", { children: table.getRowModel().rows.map((row) => (_jsx("tr", { children: row.getVisibleCells().map((cell) => (_jsx("td", { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] }) }))] }));
}
export default EverBoughtPage;
