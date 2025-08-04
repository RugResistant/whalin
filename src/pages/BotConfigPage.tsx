import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useReactTable, getCoreRowModel, flexRender, type ColumnDef } from '@tanstack/react-table';
import { Settings, Wallet, Save, Trash2 } from 'lucide-react';
import clsx from 'clsx';

function BotConfigPage() {
  const queryClient = useQueryClient();
  const [newWhaleAddress, setNewWhaleAddress] = useState('');
  const [newWhaleDescription, setNewWhaleDescription] = useState('');
  const [filterText, setFilterText] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'inactive'>('all');
  const [notifMessage, setNotifMessage] = useState('');

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

  const filteredWhales = whales.filter((w) => {
    const matchesFilter = w.address.toLowerCase().includes(filterText.toLowerCase()) || (w.description || '').toLowerCase().includes(filterText.toLowerCase());
    const matchesTab = activeTab === 'all' || (activeTab === 'active' ? w.active : !w.active);
    return matchesFilter && matchesTab;
  });

  const updateConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from('bot_config').update({ value }).eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot_configs'] });
      setNotifMessage('Configuration updated successfully.');
    },
  });

  const addWhale = useMutation({
    mutationFn: async ({ address, description }: { address: string; description: string }) => {
      const { error } = await supabase.from('whale_wallets').insert({ address, description, active: true });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whale_wallets'] });
      setNotifMessage('Whale wallet added.');
    },
  });

  const toggleWhale = useMutation({
    mutationFn: async ({ address, active }: { address: string; active: boolean }) => {
      const { error } = await supabase.from('whale_wallets').update({ active }).eq('address', address);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whale_wallets'] });
      setNotifMessage('Whale wallet status updated.');
    },
  });

  const deleteWhale = useMutation({
    mutationFn: async (address: string) => {
      const { error } = await supabase.from('whale_wallets').delete().eq('address', address);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whale_wallets'] });
      setNotifMessage('Whale wallet deleted.');
    },
  });

  const confirmDelete = (address: string) => {
    if (window.confirm('Are you sure you want to delete this wallet?')) {
      deleteWhale.mutate(address);
    }
  };

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
                  supabase.from('whale_wallets').update({ description: localDesc }).eq('address', row.original.address).then(() => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }));
                  setDirty(false);
                  setNotifMessage('Description updated.');
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
          onChange={(e) => toggleWhale.mutate({ address: row.original.address, active: e.target.checked })}
        />
      ),
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <button
          className="btn btn-xs btn-error btn-outline"
          onClick={() => confirmDelete(row.original.address)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];

  const whaleTable = useReactTable({
    data: filteredWhales,
    columns: whaleColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  const handleAddWhale = () => {
    if (newWhaleAddress) {
      addWhale.mutate({ address: newWhaleAddress, description: newWhaleDescription });
      setNewWhaleAddress('');
      setNewWhaleDescription('');
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {notifMessage && (
        <div className="alert alert-success shadow-sm">
          <div>{notifMessage}</div>
        </div>
      )}

      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="tabs">
          <a className={clsx('tab tab-bordered', activeTab === 'all' && 'tab-active')} onClick={() => setActiveTab('all')}>All</a>
          <a className={clsx('tab tab-bordered', activeTab === 'active' && 'tab-active')} onClick={() => setActiveTab('active')}>Active</a>
          <a className={clsx('tab tab-bordered', activeTab === 'inactive' && 'tab-active')} onClick={() => setActiveTab('inactive')}>Inactive</a>
        </div>
        <input
          type="text"
          placeholder="Search wallets or descriptions..."
          className="input input-sm input-bordered w-full max-w-xs"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
        />
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
      ) : (
        <div className="overflow-x-auto rounded-lg border border-base-300">
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
  );
}

export default BotConfigPage;
