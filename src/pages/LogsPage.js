import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/LogsPage.tsx
import { useState } from 'react';
import { useLogs } from '../hooks/useData';
import { format } from 'date-fns';
import { flexRender, getCoreRowModel, getFilteredRowModel, useReactTable, } from '@tanstack/react-table';
function LogsPage() {
    const { data = [], isLoading, error } = useLogs();
    const [globalFilter, setGlobalFilter] = useState('');
    const columns = [
        { accessorKey: 'type', header: '📁 Type' },
        { accessorKey: 'message', header: '📝 Message' },
        { accessorKey: 'token_mint', header: '🧬 Token Mint' },
        { accessorKey: 'sig', header: '🔏 Sig' },
        {
            accessorKey: 'data',
            header: '📦 Data',
            cell: ({ getValue }) => (_jsx("pre", { className: "whitespace-pre-wrap text-xs overflow-auto max-h-32", children: JSON.stringify(getValue(), null, 2) })),
        },
        {
            accessorKey: 'created_at',
            header: '📅 Created At',
            cell: ({ getValue }) => format(new Date(getValue()), 'PPP p'),
        },
    ];
    const table = useReactTable({
        data,
        columns,
        state: { globalFilter },
        onGlobalFilterChange: setGlobalFilter,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
    });
    return (_jsxs("div", { className: "max-w-7xl mx-auto py-8 px-4 space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "\uD83E\uDDE0 Bot Logs" }), _jsx("input", { value: globalFilter, onChange: (e) => setGlobalFilter(String(e.target.value)), className: "input input-bordered w-full max-w-xl", placeholder: "Search logs globally..." }), isLoading && _jsx("div", { className: "loading loading-spinner text-primary" }), error && _jsx("div", { className: "alert alert-error", children: "Failed to load logs" }), !isLoading && !error && (_jsx("div", { className: "overflow-x-auto rounded-lg border border-base-300", children: _jsxs("table", { className: "table table-zebra table-sm w-full", children: [_jsx("thead", { className: "bg-base-300 text-sm", children: table.getHeaderGroups().map((group) => (_jsx("tr", { children: group.headers.map((header) => (_jsx("th", { children: header.isPlaceholder
                                        ? null
                                        : flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, group.id))) }), _jsx("tbody", { children: table.getRowModel().rows.map((row) => (_jsx("tr", { children: row.getVisibleCells().map((cell) => (_jsx("td", { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] }) }))] }));
}
export default LogsPage;
