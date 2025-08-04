import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { Settings, Wallet, Save, Trash2 } from 'lucide-react';
import clsx from 'clsx';

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
        const [dirty, setDirty] = useState(false);

        return (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              className="input input-sm input-bordered w-full"
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                setDirty(true);
              }}
              onBlur={() => {
                if (dirty && localValue !== row.original.value) {
                  updateConfig.mutate({ key: row.original.key, value: localValue });
                  setDirty(false);
                }
              }}
            />
            {dirty && <Save className="w-4 h-4 text-blue-500" />}
          </div>
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
        const [dirty, setDirty] = useState(false);

        return (
          <div className="flex items-center space-x-2">
            <input
              type="text"
              className="input input-sm input-bordered w-full"
              value={localDesc}
              onChange={(e) => {
                setLocalDesc(e.target.value);
                setDirty(true);
              }}
              onBlur={() => {
                if (dirty && localDesc !== row.original.description) {
                  supabase
                    .from('whale_wallets')
                    .update({ description: localDesc })
                    .eq('address', row.original.address)
                    .then(() => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }));
                  setDirty(false);
                }
              }}
            />
            {dirty && <Save className="w-4 h-4 text-green-500" />}
          </div>
        );
      },
    },
    {
      accessorKey: 'active',
      header: 'Active',
      cell: ({ row }) => (
        <input
          type="checkbox"
          className="toggle toggle-sm"
          checked={row.original.active}
          onChange={(e) =>
            toggleWhale.mutate({ address: row.original.address, active: e.target.checked })
          }
        />
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <button
          className="btn btn-xs btn-error btn-outline"
          onClick={() => deleteWhale.mutate(row.original.address)}
        >
          <Trash2 className="w-4 h-4" />
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

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Bot Configuration</h1>
      </div>

      {/* CONFIGS */}
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Settings className="w-5 h-5" /> Configs
          </h2>
          {configsLoading ? (
            <div className="loading loading-spinner text-primary" />
          ) : configs.length === 0 ? (
            <div className="text-sm text-gray-500">No configs found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm w-full">
                <thead className="bg-base-200">
                  {configTable.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => (
                        <th key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
          )}
        </div>
      </div>

      {/* WHALES */}
      <div className="card border border-base-300 bg-base-100 shadow-sm">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5" /> Whale Wallets
            </h2>
            <span className="badge badge-primary badge-outline">
              {whales?.length || 0} Tracked
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={newWhaleAddress}
              onChange={(e) => setNewWhaleAddress(e.target.value)}
              placeholder="Wallet address"
              className="input input-bordered w-full"
            />
            <input
              type="text"
              value={newWhaleDescription}
              onChange={(e) => setNewWhaleDescription(e.target.value)}
              placeholder="Optional description"
              className="input input-bordered w-full"
            />
            <button className="btn btn-primary" onClick={handleAddWhale}>
              Add
            </button>
          </div>

          {whalesLoading ? (
            <div className="loading loading-spinner text-primary" />
          ) : whales.length === 0 ? (
            <div className="text-sm text-gray-500">No whale wallets found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra table-sm w-full">
                <thead className="bg-base-200">
                  {whaleTable.getHeaderGroups().map((group) => (
                    <tr key={group.id}>
                      {group.headers.map((header) => (
                        <th key={header.id}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
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
          )}
        </div>
      </div>
    </div>
  );
}

export default BotConfigPage;
