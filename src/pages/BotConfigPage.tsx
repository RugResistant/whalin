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
  Coins,
  Info,
} from 'lucide-react';

function parseTakeProfit(value: string): { multiple: number; percent: number }[] {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function displayLabel(key: string): string {
  const map: Record<string, string> = {
    high_mc_initial_stop_loss_ratio: 'Initial Stop Loss % (High MC)',
    high_mc_recover_initial_at_multiple: 'Recover Capital At (x)',
    high_mc_take_profit_levels: 'Take Profit Levels',
    high_mc_trailing_activation_ratio: 'Trailing Stop Activation (x)',
    high_mc_trailing_cushion: 'Trailing Cushion %',
  };
  return map[key] || key;
}

function getTooltip(key: string): string {
  const tips: Record<string, string> = {
    high_mc_initial_stop_loss_ratio:
      'Sell the token if it drops by this percentage from your buy price. (e.g. 0.5 = 50%)',
    high_mc_recover_initial_at_multiple:
      'Once price reaches this multiple, sell enough to recover your initial investment.',
    high_mc_take_profit_levels:
      'Define profit-taking levels. E.g. Sell 20% at 5x.',
    high_mc_trailing_activation_ratio:
      'When the token hits this x-multiple, begin trailing stop.',
    high_mc_trailing_cushion:
      'The percentage the price must drop from the peak after activation to trigger a sell.',
  };
  return tips[key] || '';
}

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

  const { data: strategyConfigs = [], isLoading: strategyLoading } = useQuery({
    queryKey: ['strategy_configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('strategy_config').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: trackedTokens = [], isLoading: trackedLoading } = useQuery({
    queryKey: ['tracked_tokens'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tracked_tokens').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: immediateSells = [] } = useQuery({
    queryKey: ['immediate_sells'],
    queryFn: async () => {
      const { data, error } = await supabase.from('immediate_sells').select('*');
      if (error) throw error;
      return data;
    },
  });

  const updateStrategyConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase
        .from('strategy_config')
        .update({ value })
        .eq('key', key);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategy_configs'] }),
  });

  const strategyColumns: ColumnDef<any>[] = [
    {
      accessorKey: 'key',
      header: 'Setting',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold">{displayLabel(row.original.key)}</span>
          <div className="tooltip tooltip-right" data-tip={getTooltip(row.original.key)}>
            <Info className="w-4 h-4 text-blue-400" />
          </div>
        </div>
      ),
    },
    {
      accessorKey: 'value',
      header: 'Value',
      cell: ({ row }) => {
        const key = row.original.key;
        const rawValue = row.original.value;

        const [localValue, setLocalValue] = useState(rawValue);
        const [dirty, setDirty] = useState(false);

        // Custom rendering for JSON fields
        if (key === 'high_mc_take_profit_levels') {
          const parsed = parseTakeProfit(rawValue);

          return (
            <div className="flex flex-col gap-2">
              {parsed.map((tp, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <input
                    type="number"
                    className="input input-sm input-bordered w-24"
                    value={tp.multiple}
                    onChange={(e) => {
                      parsed[idx].multiple = parseFloat(e.target.value);
                      setLocalValue(JSON.stringify(parsed));
                      setDirty(true);
                    }}
                    placeholder="x"
                  />
                  <input
                    type="number"
                    className="input input-sm input-bordered w-24"
                    value={tp.percent}
                    onChange={(e) => {
                      parsed[idx].percent = parseFloat(e.target.value);
                      setLocalValue(JSON.stringify(parsed));
                      setDirty(true);
                    }}
                    placeholder="%"
                  />
                </div>
              ))}
              <button
                className="btn btn-xs btn-outline"
                onClick={() => {
                  const updated = [...parsed, { multiple: 2, percent: 10 }];
                  setLocalValue(JSON.stringify(updated));
                  setDirty(true);
                }}
              >
                + Add Level
              </button>
              {dirty && (
                <div className="flex items-center gap-1 mt-2">
                  <Save className="w-4 h-4 text-green-500" />
                  <span className="text-sm">Unsaved</span>
                </div>
              )}
              <button
                className="btn btn-xs btn-primary mt-1"
                onClick={() => {
                  updateStrategyConfig.mutate({ key, value: localValue });
                  setDirty(false);
                }}
              >
                Save Changes
              </button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="any"
              className="input input-sm input-bordered w-36"
              value={localValue}
              onChange={(e) => {
                setLocalValue(e.target.value);
                setDirty(true);
              }}
              onBlur={() => {
                if (dirty && localValue !== rawValue) {
                  updateStrategyConfig.mutate({ key, value: localValue });
                  setDirty(false);
                }
              }}
            />
            {dirty && <Save className="w-4 h-4 text-green-500" />}
          </div>
        );
      },
    },
  ];

  const strategyTable = useReactTable({
    data: strategyConfigs,
    columns: strategyColumns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-10">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Bot Configuration</h1>
      </div>

      {/* STRATEGY CONFIGS */}
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body">
          <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            Sell Strategy Settings
          </h2>
          {strategyLoading ? (
            <div className="loading loading-spinner text-primary" />
          ) : strategyConfigs.length === 0 ? (
            <p className="text-sm text-gray-500">No strategy configs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead className="bg-base-200">
                  {strategyTable.getHeaderGroups().map((group) => (
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
                  {strategyTable.getRowModel().rows.map((row) => (
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
      {/* GLOBAL CONFIGS (unchanged logic, can be improved later) */}
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body">
          <h2 className="text-2xl font-semibold flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5" />
            Global Configs
          </h2>
          {configsLoading ? (
            <div className="loading loading-spinner text-primary" />
          ) : configs.length === 0 ? (
            <p className="text-sm text-gray-500">No global configs found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th>Key</th>
                    <th>Description</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config, i) => (
                    <tr key={i}>
                      <td className="font-medium">{config.key}</td>
                      <td>{config.description}</td>
                      <td>
                        <input
                          className="input input-sm input-bordered w-48"
                          defaultValue={config.value}
                          onBlur={(e) => {
                            if (e.target.value !== config.value) {
                              supabase
                                .from('bot_config')
                                .update({ value: e.target.value })
                                .eq('key', config.key)
                                .then(() =>
                                  queryClient.invalidateQueries({ queryKey: ['bot_configs'] })
                                );
                            }
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* WHALE WALLETS */}
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
          <AddWhaleForm queryClient={queryClient} />
          {whalesLoading ? (
            <div className="loading loading-spinner text-primary" />
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-sm w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th>Address</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th>Delete</th>
                  </tr>
                </thead>
                <tbody>
                  {whales.map((row) => (
                    <tr key={row.address}>
                      <td>{row.address}</td>
                      <td>
                        <input
                          className="input input-sm input-bordered"
                          defaultValue={row.description}
                          onBlur={(e) => {
                            if (e.target.value !== row.description) {
                              supabase
                                .from('whale_wallets')
                                .update({ description: e.target.value })
                                .eq('address', row.address)
                                .then(() =>
                                  queryClient.invalidateQueries({ queryKey: ['whale_wallets'] })
                                );
                            }
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          className="toggle toggle-success toggle-sm"
                          checked={row.active}
                          onChange={() => {
                            supabase
                              .from('whale_wallets')
                              .update({ active: !row.active })
                              .eq('address', row.address)
                              .then(() =>
                                queryClient.invalidateQueries({ queryKey: ['whale_wallets'] })
                              );
                          }}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-xs btn-outline btn-error"
                          onClick={() => {
                            supabase
                              .from('whale_wallets')
                              .delete()
                              .eq('address', row.address)
                              .then(() =>
                                queryClient.invalidateQueries({ queryKey: ['whale_wallets'] })
                              );
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* TRACKED TOKENS */}
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
                  <tr>
                    <th>Token</th>
                    <th>Buy Price</th>
                    <th>Type</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {trackedTokens.map((row) => {
                    const sellStatus = immediateSells.find(s => s.token_mint === row.token_mint)?.status;
                    const isPending = sellStatus === 'pending';

                    return (
                      <tr key={row.token_mint}>
                        <td>{row.token_mint}</td>
                        <td>{row.buy_price}</td>
                        <td>{row.token_type}</td>
                        <td>
                          <button
                            className={`btn btn-xs ${isPending ? 'btn-disabled' : 'btn-error'}`}
                            onClick={() => {
                              if (!isPending) {
                                supabase
                                  .from('immediate_sells')
                                  .upsert({ token_mint: row.token_mint, status: 'pending' })
                                  .then(() => {
                                    queryClient.invalidateQueries({ queryKey: ['immediate_sells'] });
                                    queryClient.invalidateQueries({ queryKey: ['tracked_tokens'] });
                                  });
                              }
                            }}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <span className="loading loading-spinner loading-xs" />
                            ) : (
                              'Sell Now'
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddWhaleForm({ queryClient }: { queryClient: ReturnType<typeof useQueryClient> }) {
  const [newWhaleAddress, setNewWhaleAddress] = useState('');
  const [newWhaleDescription, setNewWhaleDescription] = useState('');

  const handleAdd = async () => {
    if (!newWhaleAddress) return;
    await supabase
      .from('whale_wallets')
      .insert({
        address: newWhaleAddress,
        description: newWhaleDescription,
        active: true,
      });
    queryClient.invalidateQueries({ queryKey: ['whale_wallets'] });
    setNewWhaleAddress('');
    setNewWhaleDescription('');
  };

  return (
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
      <button className="btn btn-primary btn-sm sm:w-auto" onClick={handleAdd}>
        <PlusCircle className="w-4 h-4 mr-1" />
        Add
      </button>
    </div>
  );
}

export default BotConfigPage;
