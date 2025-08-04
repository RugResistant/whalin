import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ColumnDef } from '@tanstack/react-table';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
} from '@tanstack/react-table';

function BotConfigPage() {
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading: configsLoading, error: configsError } = useQuery({
    queryKey: ['bot_configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bot_config').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: whales = [], isLoading: whalesLoading, error: whalesError } = useQuery({
    queryKey: ['whale_wallets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whale_wallets').select('*');
      if (error) throw error;
      return data;
    },
  });

  const updateConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from('bot_config').update({ value }).eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot_configs'] }),
  });

  const addWhale = useMutation({
    mutationFn: async ({ address, description }: { address: string; description: string }) => {
      const { error } = await supabase
        .from('whale_wallets')
        .insert({ address, description, active: true });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
  });

  const toggleWhale = useMutation({
    mutationFn: async ({ address, active }: { address: string; active: boolean }) => {
      const { error } = await supabase.from('whale_wallets').update({ active }).eq('address', address);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
  });

  const deleteWhale = useMutation({
    mutationFn: async (address: string) => {
      const { error } = await supabase.from('whale_wallets').delete().eq('address', address);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
  });

  const configColumns: ColumnDef<any>[] = [
    { accessorKey: 'key', header: 'Key' },
    { accessorKey: 'description', header: 'Description' },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => {
        const [localValue, setLocalValue] = useState(row.original.value || '');

        return (
          <input
            type="text"
            className="input input-bordered w-full"
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            onBlur={() => {
              if (localValue !== row.original.value) {
                updateConfig.mutate({ key: row.original.key, value: localValue });
              }
            }}
          />
        );
      },
    },
  ];

  const configTable = useReactTable({
    data: configs,
    columns: configColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const whaleColumns: ColumnDef<any>[] = [
    { accessorKey: 'address', header: 'Address' },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const [localDesc, setLocalDesc] = useState(row.original.description || '');

        return (
          <input
            type="text"
            className="input input-bordered input-sm w-full"
            value={localDesc}
            onChange={(e) => setLocalDesc(e.target.value)}
            onBlur={() => {
              if (localDesc !== row.original.description) {
                supabase
                  .from('whale_wallets')
                  .update({ description: localDesc })
                  .eq('address', row.original.address)
                  .then(() => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }));
              }
            }}
          />
        );
      },
    },
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

  const [newWhaleAddress, setNewWhaleAddress] = useState('');
  const [newWhaleDescription, setNewWhaleDescription] = useState('');
  const handleAddWhale = () => {
    if (newWhaleAddress) {
      addWhale.mutate({ address: newWhaleAddress, description: newWhaleDescription });
      setNewWhaleAddress('');
      setNewWhaleDescription('');
    }
  };

  if (configsLoading || whalesLoading) {
    return <div className="loading loading-spinner text-primary mt-8" />;
  }

  if (configsError || whalesError) {
    return (
      <div className="alert alert-error mt-8">
        Error loading config data: {(configsError || whalesError)?.message}
      </div>
    );
  }

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
            placeholder="Whale address (e.g. 7dkU7s3...)"
            className="input input-bordered w-1/2"
          />
          <input
            type="text"
            value={newWhaleDescription}
            onChange={(e) => setNewWhaleDescription(e.target.value)}
            placeholder="Description (optional)"
            className="input input-bordered w-1/2"
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
