import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/pages/BotConfigPage.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase'; // Import your Supabase client
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { flexRender, getCoreRowModel, useReactTable, } from '@tanstack/react-table';
function BotConfigPage() {
    const queryClient = useQueryClient();
    // Fetch configs
    const { data: configs = [], isLoading: configsLoading, error: configsError } = useQuery({
        queryKey: ['bot_configs'],
        queryFn: async () => {
            const { data, error } = await supabase.from('bot_config').select('*');
            if (error)
                throw error;
            return data;
        },
    });
    // Fetch whales
    const { data: whales = [], isLoading: whalesLoading, error: whalesError } = useQuery({
        queryKey: ['whale_wallets'],
        queryFn: async () => {
            const { data, error } = await supabase.from('whale_wallets').select('*');
            if (error)
                throw error;
            return data;
        },
    });
    // Mutation for updating config
    const updateConfig = useMutation({
        mutationFn: async ({ key, value }) => {
            const { error } = await supabase.from('bot_config').update({ value }).eq('key', key);
            if (error)
                throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot_configs'] }),
    });
    // Mutation for adding whale
    const addWhale = useMutation({
        mutationFn: async (address) => {
            const { error } = await supabase.from('whale_wallets').insert({ address, active: true });
            if (error)
                throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
    });
    // Mutation for toggling whale active
    const toggleWhale = useMutation({
        mutationFn: async ({ address, active }) => {
            const { error } = await supabase.from('whale_wallets').update({ active }).eq('address', address);
            if (error)
                throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
    });
    // Mutation for deleting whale
    const deleteWhale = useMutation({
        mutationFn: async (address) => {
            const { error } = await supabase.from('whale_wallets').delete().eq('address', address);
            if (error)
                throw error;
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
    });
    // Config table columns
    const configColumns = [
        { accessorKey: 'key', header: 'Key' },
        { accessorKey: 'description', header: 'Description' },
        {
            accessorKey: 'value',
            header: 'Value',
            cell: ({ row }) => (_jsx("input", { type: "text", value: row.original.value, onBlur: (e) => updateConfig.mutate({ key: row.original.key, value: e.target.value }), className: "input input-bordered w-full" })),
        },
    ];
    const configTable = useReactTable({
        data: configs,
        columns: configColumns,
        getCoreRowModel: getCoreRowModel(),
    });
    // Whale table columns
    const whaleColumns = [
        { accessorKey: 'address', header: 'Address' },
        {
            accessorKey: 'active',
            header: 'Active',
            cell: ({ row }) => (_jsx("input", { type: "checkbox", checked: row.original.active, onChange: (e) => toggleWhale.mutate({ address: row.original.address, active: e.target.checked }) })),
        },
        {
            header: 'Actions',
            cell: ({ row }) => (_jsx("button", { className: "btn btn-error btn-xs", onClick: () => deleteWhale.mutate(row.original.address), children: "Delete" })),
        },
    ];
    const whaleTable = useReactTable({
        data: whales,
        columns: whaleColumns,
        getCoreRowModel: getCoreRowModel(),
    });
    // Add new whale form
    const [newWhaleAddress, setNewWhaleAddress] = useState('');
    const handleAddWhale = () => {
        if (newWhaleAddress) {
            addWhale.mutate(newWhaleAddress);
            setNewWhaleAddress('');
        }
    };
    if (configsLoading || whalesLoading)
        return _jsx("div", { className: "loading loading-spinner text-primary mt-8" });
    if (configsError || whalesError)
        return _jsxs("div", { className: "alert alert-error mt-8", children: ["Error loading config data: ", (configsError || whalesError)?.message] });
    return (_jsxs("div", { className: "max-w-7xl mx-auto py-8 px-4 space-y-6", children: [_jsx("h1", { className: "text-3xl font-bold", children: "Bot Configuration" }), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Configs" }), _jsx("div", { className: "overflow-x-auto rounded-lg border border-base-300", children: _jsxs("table", { className: "table table-zebra table-sm w-full", children: [_jsx("thead", { className: "bg-base-300 text-sm", children: configTable.getHeaderGroups().map((group) => (_jsx("tr", { children: group.headers.map((header) => (_jsx("th", { children: header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, group.id))) }), _jsx("tbody", { children: configTable.getRowModel().rows.map((row) => (_jsx("tr", { children: row.getVisibleCells().map((cell) => (_jsx("td", { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] }) })] }), _jsxs("div", { className: "space-y-4", children: [_jsx("h2", { className: "text-2xl font-semibold", children: "Whale Wallets" }), _jsxs("div", { className: "flex space-x-2", children: [_jsx("input", { type: "text", value: newWhaleAddress, onChange: (e) => setNewWhaleAddress(e.target.value), placeholder: "Add new whale address (e.g., suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK)", className: "input input-bordered flex-1" }), _jsx("button", { className: "btn btn-primary", onClick: handleAddWhale, children: "Add" })] }), _jsx("div", { className: "overflow-x-auto rounded-lg border border-base-300", children: _jsxs("table", { className: "table table-zebra table-sm w-full", children: [_jsx("thead", { className: "bg-base-300 text-sm", children: whaleTable.getHeaderGroups().map((group) => (_jsx("tr", { children: group.headers.map((header) => (_jsx("th", { children: header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext()) }, header.id))) }, group.id))) }), _jsx("tbody", { children: whaleTable.getRowModel().rows.map((row) => (_jsx("tr", { children: row.getVisibleCells().map((cell) => (_jsx("td", { children: flexRender(cell.column.columnDef.cell, cell.getContext()) }, cell.id))) }, row.id))) })] }) })] })] }));
}
export default BotConfigPage;
