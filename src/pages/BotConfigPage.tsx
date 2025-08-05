import { useState } from 'react';
import { supabase } from '../lib/supabase';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  type ColumnDef,
} from '@tanstack/react-table';
import {
  Settings,
  Wallet,
  Save,
  Trash2,
  PlusCircle,
  Coins,  // New icon for tracked tokens
} from 'lucide-react';

function BotConfigPage() {
  const queryClient = useQueryClient();
  const { data: configs = [], isLoading: configsLoading } = useQuery({
    queryKey: ['bot_configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bot_config').select('*');
      if (error) throw error;
      return data;
    },
  });
  const { data: whales = [], isLoading: whalesLoading } = useQuery({
    queryKey: ['whale_wallets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whale_wallets').select('*');
      if (error) throw error;
      return data;
    },
  });
  // New: Query for tracked tokens
  const { data: trackedTokens = [], isLoading: trackedLoading } = useQuery({
    queryKey: ['tracked_tokens'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tracked_tokens').select('*');
      if (error) throw error;
      return data;
    },
  });
  // New: Query for immediate sells (to show status)
  const { data: immediateSells = [] } = useQuery({
    queryKey: ['immediate_sells'],
    queryFn: async () => {
      const { data, error } = await supabase.from('immediate_sells').select('*');
      if (error) throw error;
      return data;
    },
  });
  const updateConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('bot_config')
        .update({ value })
        .eq('key', key);
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
      const { error } = await supabase
        .from('whale_wallets')
        .update({ active })
        .eq('address', address);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
  });
  const deleteWhale = useMutation({
    mutationFn: async (address: string) => {
      const { error } = await supabase
        .from('whale_wallets')
        .delete()
        .eq('address', address);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['whale_wallets'] }),
  });
  // New: Mutation to trigger immediate sell
  const triggerImmediateSell = useMutation({
    mutationFn: async (tokenMint: string) => {
      const { error } = await supabase
        .from('immediate_sells')
        .upsert({ token_mint: tokenMint, status: 'pending' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['immediate_sells'] });
      queryClient.invalidateQueries({ queryKey: ['tracked_tokens'] });
    },
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
          <div className="flex items-center gap-2">
            <input
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
  const whaleColumns: ColumnDef<any>[] = [
    { accessorKey: 'address', header: 'Address' },
    {
      accessorKey: 'description',
      header: 'Description',
      cell: ({ row }) => {
        const [localDesc, setLocalDesc] = useState(row.original.description || '');
        const [dirty, setDirty] = useState(false);
        return (
          <div className="flex items-center gap-2">
            <input
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
                    .then(() =>
                      queryClient.invalidateQueries({ queryKey: ['whale_wallets'] })
                    );
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
      cell: ({ row }) => {
        const active = row.original.active;
        const address = row.original.address;
        const handleToggle = () => {
          toggleWhale.mutate({ address, active: !active });
        };
        return (
          <div
            className="relative inline-block w-10 h-6"
            onClick={handleToggle}
          >
            <input
              type="checkbox"
              className="sr-only peer"
              checked={active}
              onChange={handleToggle}
            />
            <div className="w-10 h-6 bg-gray-300 rounded-full peer-checked:bg-green-500 transition duration-300"></div>
            <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full transition peer-checked:translate-x-full"></div>
          </div>
        );
      },
    },
    {
      header: 'Actions',
      cell: ({ row }) => (
        <button
          className="btn btn-xs btn-outline btn-error"
          onClick={() => deleteWhale.mutate(row.original.address)}
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ),
    },
  ];
  // New: Columns for tracked tokens table
  const trackedColumns: ColumnDef<any>[] = [
    { accessorKey: 'token_mint', header: 'Token Mint' },
    { accessorKey: 'buy_price', header: 'Buy Price' },
    { accessorKey: 'token_type', header: 'Type' },
    {
      header: 'Actions',
      cell: ({ row }) => {
        const tokenMint = row.original.token_mint;
        const sellStatus = immediateSells.find(s => s.token_mint === tokenMint)?.status;
        const isPending = sellStatus === 'pending';
        return (
          <button
            className={`btn btn-xs ${isPending ? 'btn-disabled' : 'btn-error'}`}
            onClick={() => !isPending && triggerImmediateSell.mutate(tokenMint)}
            disabled={isPending}
          >
            {isPending ? (
              <span className="loading loading-spinner loading-xs"></span>
            ) : (
              'Sell Now'
            )}
            {sellStatus && !isPending && <span className="ml-2 badge badge-sm">{sellStatus}</span>}
          </button>
        );
      },
    },
  ];
  const configTable = useReactTable({
    data: configs,
    columns: configColumns,
    getCoreRowModel: getCoreRowModel(),
  });
  const whaleTable = useReactTable({
    data: whales,
    columns: whaleColumns,
    getCoreRowModel: getCoreRowModel(),
  });
  // New: Table for tracked tokens
  const trackedTable = useReactTable({
    data: trackedTokens,
    columns: trackedColumns,
    getCoreRowModel: getCoreRowModel(),
  });
  const [newWhaleAddress, setNewWhaleAddress] = useState('');
  const [newWhaleDescription, setNewWhaleDescription] = useState('');
  const handleAddWhale = () => {
    if (newWhaleAddress) {
      addWhale.mutate({
        address: newWhaleAddress,
        description: newWhaleDescription,
      });
      setNewWhaleAddress('');
      setNewWhaleDescription('');
    }
  };
  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Bot Configuration</h1>
      </div>
      {/* CONFIGS */}
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body">
          <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            Global Configs
          </h2>
          {configsLoading ? (
            <div className="loading loading-spinner text-primary" />
          ) : configs.length === 0 ? (
            <p className="text-sm text-gray-500">No configs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm table-auto w-full">
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
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Wallet className="w-5 h-5" />
              Whale Wallets
            </h2>
            <span className="badge badge-primary badge-outline">
              {whales.length} Tracked
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              className="input input-sm input-bordered w-full sm:w-1/3"
              placeholder="Wallet address"
              value={newWhaleAddress}
              onChange={(e) => setNewWhaleAddress(e.target.value)}
            />
            <input
              type="text"
              className="input input-sm input-bordered w-full sm:w-1/3"
              placeholder="Optional description"
              value={newWhaleDescription}
              onChange={(e) => setNewWhaleDescription(e.target.value)}
            />
            <button className="btn btn-primary btn-sm sm:w-auto" onClick={handleAddWhale}>
              <PlusCircle className="w-4 h-4 mr-1" />
              Add
            </button>
          </div>
          {whalesLoading ? (
            <div className="loading loading-spinner text-primary" />
          ) : whales.length === 0 ? (
            <p className="text-sm text-gray-500">No whale wallets found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm table-auto w-full">
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
      {/* New: TRACKED TOKENS */}
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              <Coins className="w-5 h-5" />
              Tracked Tokens (Holdings)
            </h2>
            <span className="badge badge-primary badge-outline">
              {trackedTokens.length} Holdings
            </span>
          </div>
          {trackedLoading ? (
            <div className="loading loading-spinner text-primary" />
          ) : trackedTokens.length === 0 ? (
            <p className="text-sm text-gray-500">No tracked tokens.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm table-auto w-full">
                <thead className="bg-base-200">
                  {trackedTable.getHeaderGroups().map((group) => (
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
                  {trackedTable.getRowModel().rows.map((row) => (
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
