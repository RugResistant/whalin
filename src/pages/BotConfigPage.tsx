// src/pages/BotConfigPage.tsx
import { useState } from 'react';
import { supabase } from '../lib/supabase'; // Import your Supabase client
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

function BotConfigPage() {
  const queryClient = useQueryClient();

  // Fetch configs
  const { data: configs = [], isLoading: configsLoading, error: configsError } = useQuery({
    queryKey: ['bot_configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bot_config').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Fetch whales
  const { data: whales = [], isLoading: whalesLoading, error: whalesError } = useQuery({
    queryKey: ['whale_wallets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whale_wallets').select('*');
      if (error) throw error;
      return data;
    },
  });

  // Mutation for updating config
  const updateConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from('bot_config').update({ value }).eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot_configs'] }),
  });

  // Mutation for adding whale
  const addWhale = useMutation({
    mutationFn: async (address: string) => {
      const { error } = await supabase.from('whale_wallets').insert({ address, active: true });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
  });

  // Mutation for toggling whale active
  const toggleWhale = useMutation({
    mutationFn: async ({ address, active }: { address: string; active: boolean }) => {
      const { error } = await supabase.from('whale_wallets').update({ active }).eq('address', address);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
  });

  // Mutation for deleting whale
  const deleteWhale = useMutation({
    mutationFn: async (address: string) => {
      const { error } = await supabase.from('whale_wallets').delete().eq('address', address);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
  });

  // Config table columns
  const configColumns: ColumnDef<any>[] = [
    { accessorKey: 'key', header: 'Key' },
    { accessorKey: 'description', header: 'Description' },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => (
        <input
          type="text"
          value={row.original.value}
          onBlur={(e) => updateConfig.mutate({ key: row.original.key, value: e.target.value })}
          className="input input-bordered w-full"
        />
      ),
    },
  ];

  const configTable = useReactTable({
    data: configs,
    columns: configColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  // Whale table columns
  const whaleColumns: ColumnDef<any>[] = [
    { accessorKey: 'address', header: 'Address' },
    {
      accessorKey: 'active',
      header: 'Active',
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.original.active}
          onChange={(e) => toggleWhale.mutate({ address: row.original.address, active: e.target.checked })}
        />
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <button
          className="btn btn-error btn-xs"
          onClick={() => deleteWhale.mutate(row.original.address)}
        >
          Delete
        </button>
      ),
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

  if (configsLoading || whalesLoading) return <div className="loading loading-spinner text-primary mt-8" />;
  if (configsError || whalesError) return <div className="alert alert-error mt-8">Error loading config data: {(configsError || whalesError)?.message}</div>;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Bot Configuration</h1>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Configs</h2>
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra table-sm w-full">
            <thead className="bg-base-300 text-sm">
              {configTable.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {configTable.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Whale Wallets</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            value={newWhaleAddress}
            onChange={(e) => setNewWhaleAddress(e.target.value)}
            placeholder="Add new whale address (e.g., suqh5sHtr8HyJ7q8scBimULPkPpA557prMG47xCHQfK)"
            className="input input-bordered flex-1"
          />
          <button className="btn btn-primary" onClick={handleAddWhale}>
            Add
          </button>
        </div>
        <div className="overflow-x-auto rounded-lg border border-base-300">
          <table className="table table-zebra table-sm w-full">
            <thead className="bg-base-300 text-sm">
              {whaleTable.getHeaderGroups().map((group) => (
                <tr key={group.id}>
                  {group.headers.map((header) => (
                    <th key={header.id}>
                      {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {whaleTable.getRowModel().rows.map((row) => (
                <tr key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default BotConfigPage;