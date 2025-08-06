import { useState, useEffect, Component, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  Settings,
  Save,
  Trash2,
  PlusCircle,
  Info,
} from 'lucide-react';

type BotConfigRow = {
  key: string;
  value: string;
  description: string;
  updated_at: string;
};

type WhaleRow = {
  address: string;
  active: boolean;
  added_at: string;
  description: string;
};

type StrategyRow = {
  key: string;
  value: string;
  description: string;
};

function parseTakeProfit(value: string): { multiple?: number; ratio?: number; percent: number }[] {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      console.warn(`[parseTakeProfit] Invalid take-profit data: not an array - ${value}`);
      return [];
    }
    return parsed
      .filter(item => {
        const isValid = (typeof item.multiple === 'number' || typeof item.ratio === 'number') && typeof item.percent === 'number';
        if (!isValid) {
          console.warn(`[parseTakeProfit] Invalid take-profit item: ${JSON.stringify(item)}`);
        }
        return isValid;
      })
      .map(item => ({
        multiple: item.multiple,
        ratio: item.ratio,
        percent: item.percent,
      }));
  } catch (error) {
    console.warn(`[parseTakeProfit] Failed to parse take-profit value: ${value}`, error);
    return [];
  }
}

function displayLabel(key: string): string {
  const map: Record<string, string> = {
    trailing_initial_stop_loss_ratio: 'Initial Stop Loss Ratio',
    trailing_recover_initial_at_multiple: 'Recover Initial Investment',
    trailing_take_profit_levels: 'Take Profit Levels',
    trailing_activation_ratio: 'Trailing Stop Activation',
    trailing_cushion: 'Trailing Stop Cushion',
    simple_stop_loss_ratio: 'Stop Loss Ratio',
    simple_take_profit_ratio: 'Take Profit Multiple',
    simple_partial_sell_percent_at_take_profit: 'Sell % at Take Profit',
    simple_take_profit_steps: 'Additional Take Profit Steps',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getTooltip(key: string): string {
  const tips: Record<string, string> = {
    trailing_initial_stop_loss_ratio: 'Initial stop loss ratio before trailing activates (e.g., 0.5 means sell if price drops to 50% of buy price, or -50% loss).',
    trailing_recover_initial_at_multiple: 'Price multiple to recover initial investment (e.g., 3.0 means sell enough % to break even at 3x; set to null to disable). Only triggers once per token.',
    trailing_take_profit_levels: 'Sell a percentage of your position at specified price multiples (e.g., sell 20% at 5x buy price). Executed in order as price hits each multiple.',
    trailing_activation_ratio: 'Price multiple to activate trailing stop (e.g., 2.0 means activate at +100% gain). Once activated, trailing stop replaces initial stop loss.',
    trailing_cushion: 'Trailing stop cushion (e.g., 0.2 means sell if price drops 20% from the peak after trailing activates).',
    simple_stop_loss_ratio: 'Sell if price drops below this ratio of buy price (e.g., 0.5 means sell at -50% loss).',
    simple_take_profit_ratio: 'Sell the specified % when price reaches this multiple (e.g., 2.0 for 2x buy price).',
    simple_partial_sell_percent_at_take_profit: 'Percentage of position to sell at the take profit ratio (e.g., 50 means sell 50% of tokens).',
    simple_take_profit_steps: 'Additional take profit steps (e.g., sell 30% at 3x buy price). Executed in order as price hits each ratio.',
  };
  return tips[key] || 'No description available.';
}

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return <div className="alert alert-error">Something went wrong rendering this section. Please refresh or check your data.</div>;
    }
    return this.props.children;
  }
}

// Separate component for editable text/number field
function EditableField({ row, isBotConfig = false, isDescription = false, onSave }: { row: StrategyRow | BotConfigRow, isBotConfig?: boolean, isDescription?: boolean, onSave: (value: string) => void }) {
  const key = row.key;
  const rawValue = isDescription ? (row as BotConfigRow).description : row.value;
  const [localValue, setLocalValue] = useState(rawValue);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  const validateInput = (value: string) => {
    if (key.includes('ratio') || key.includes('multiple') || key.includes('cushion')) {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return 'Must be a positive number';
      }
      if (key.includes('stop_loss_ratio') && num >= 1) {
        return 'Stop loss ratio must be less than 1';
      }
    }
    if (key.includes('percent') && !key.includes('take_profit')) {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 100) {
        return 'Must be between 0 and 100';
      }
    }
    return null;
  };

  const save = () => {
    const validationError = validateInput(localValue);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSave(localValue);
    setError(null);
    setDirty(false);
  };

  return (
    <div className="form-control">
      <input
        type={key.includes('percent') || key.includes('ratio') || key.includes('multiple') || key.includes('cushion') ? 'number' : 'text'}
        step={key.includes('percent') ? '1' : '0.1'}
        min={key.includes('percent') ? '0' : key.includes('stop_loss_ratio') ? '0' : '1'}
        max={key.includes('percent') ? '100' : undefined}
        className={`input input-sm input-bordered w-48 ${error ? 'input-error' : ''}`}
        value={localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          setError(null);
          setDirty(true);
        }}
        onBlur={() => {
          if (dirty && localValue !== rawValue) {
            save();
          } else if (dirty) {
            setDirty(false);
          }
        }}
      />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
      {dirty && <Save className="w-4 h-4 text-green-500 cursor-pointer mt-1" onClick={save} />}
    </div>
  );
}

// Separate component for editable take-profit levels
function EditableTakeProfit({ row, onSave }: { row: StrategyRow, onSave: (value: string) => void }) {
  const [localValue, setLocalValue] = useState(row.value);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const parsed = parseTakeProfit(localValue);

  const save = () => {
    onSave(localValue);
    setError(null);
    setDirty(false);
  };

  return (
    <div className="flex flex-col gap-2 p-2 border rounded-md bg-base-200">
      <div className="text-sm font-medium">Profit Levels:</div>
      {parsed.length === 0 && <p className="text-sm text-gray-500">No profit levels configured.</p>}
      {parsed.map((tp, idx) => (
        <div key={idx} className="flex gap-2 items-center">
          <div className="form-control w-24">
            <label className="label text-xs">Multiple/Ratio</label>
            <input
              type="number"
              step="0.1"
              min="1"
              className="input input-xs input-bordered"
              value={tp.multiple ?? tp.ratio ?? 1}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 1) {
                  setError('Multiple/Ratio must be at least 1');
                  return;
                }
                const updated = [...parsed];
                if (tp.multiple !== undefined) updated[idx].multiple = value;
                if (tp.ratio !== undefined) updated[idx].ratio = value;
                setLocalValue(JSON.stringify(updated));
                setError(null);
                setDirty(true);
              }}
            />
          </div>
          <div className="form-control w-24">
            <label className="label text-xs">Sell %</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              className="input input-xs input-bordered"
              value={tp.percent ?? 0}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0 || value > 100) {
                  setError('Percent must be between 0 and 100');
                  return;
                }
                const updated = [...parsed];
                updated[idx].percent = value;
                setLocalValue(JSON.stringify(updated));
                setError(null);
                setDirty(true);
              }}
            />
          </div>
          <button
            className="btn btn-xs btn-error mt-5"
            onClick={() => {
              const updated = parsed.filter((_, i) => i !== idx);
              setLocalValue(JSON.stringify(updated));
              setDirty(true);
            }}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
      <button
        className="btn btn-xs btn-outline mt-2"
        onClick={() => {
          const field = row.key.includes('steps') ? 'ratio' : 'multiple';
          const newParsed = [...parsed, { [field]: 2, percent: 10 }];
          setLocalValue(JSON.stringify(newParsed));
          setDirty(true);
        }}
      >
        + Add Profit Level
      </button>
      {error && <p className="text-xs text-error mt-1">{error}</p>}
      {dirty && (
        <button className="btn btn-xs btn-primary mt-2" onClick={save}>
          Save Levels
        </button>
      )}
    </div>
  );
}

function BotConfigPage() {
  const queryClient = useQueryClient();
  const [activeStrategy, setActiveStrategy] = useState<string>('trailing');
  const [newWhaleAddress, setNewWhaleAddress] = useState('');
  const [newWhaleDescription, setNewWhaleDescription] = useState('');

  const { data: botConfigs, isLoading: botConfigsLoading } = useQuery<BotConfigRow[]>({
    queryKey: ['bot_configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('bot_config').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: whaleWallets, isLoading: whaleWalletsLoading } = useQuery<WhaleRow[]>({
    queryKey: ['whale_wallets'],
    queryFn: async () => {
      const { data, error } = await supabase.from('whale_wallets').select('*');
      if (error) throw error;
      return data;
    },
  });

  const { data: strategyConfigsRaw, isLoading: strategyConfigsLoading } = useQuery<StrategyRow[]>({
    queryKey: ['strategy_configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('strategy_config').select('*');
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (strategyConfigsRaw) {
      const active = strategyConfigsRaw.find((d) => d.key === 'active_strategy')?.value || 'trailing';
      setActiveStrategy(active);
    }
  }, [strategyConfigsRaw]);

  const updateBotConfig = useMutation({
    mutationFn: async ({ key, value, description }: { key: string; value: string; description: string }) => {
      const { error } = await supabase.from('bot_config').upsert({ key, value, description });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bot_configs'] }),
  });

  const updateWhale = useMutation({
    mutationFn: async ({ address, active, description }: { address: string; active: boolean; description: string }) => {
      const { error } = await supabase.from('whale_wallets').upsert({ address, active, description });
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

  const addWhale = useMutation({
    mutationFn: async ({ address, description }: { address: string; description: string }) => {
      const { error } = await supabase.from('whale_wallets').insert({ address, active: true, description });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whale_wallets'] });
      setNewWhaleAddress('');
      setNewWhaleDescription('');
    },
  });

  const updateStrategyConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from('strategy_config').upsert({ key, value });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategy_configs'] }),
  });

  const strategyConfigs: StrategyRow[] = strategyConfigsRaw ?? [];
  const trailingKeys = strategyConfigs.filter((cfg) => cfg.key.startsWith('trailing_'));
  const simpleKeys = strategyConfigs.filter((cfg) => cfg.key.startsWith('simple_'));
  const activeKeys = activeStrategy === 'trailing' ? trailingKeys : simpleKeys;

  const handleAddWhale = () => {
    if (newWhaleAddress) {
      addWhale.mutate({ address: newWhaleAddress, description: newWhaleDescription });
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Bot Configuration</h1>
      </div>

      {/* Bot Configurations Section */}
      <ErrorBoundary>
        <div className="card bg-base-100 border border-base-300 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-semibold mb-4">Bot Configurations</h2>
            {botConfigsLoading ? (
              <div className="loading loading-spinner text-primary" />
            ) : !botConfigs || botConfigs.length === 0 ? (
              <p className="text-sm text-gray-500">No configurations found.</p>
            ) : (
              <table className="table table-sm w-full">
                <thead className="bg-base-200">
                  <tr>
                    <th>Setting</th>
                    <th>Value</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {botConfigs.map((row, i) => (
                    <tr key={i}>
                      <td className="font-medium">{row.key}</td>
                      <td>
                        <EditableField row={row} isBotConfig={true} isDescription={false} onSave={(value) => updateBotConfig.mutate({ key: row.key, value, description: row.description })} />
                      </td>
                      <td>
                        <EditableField row={row} isBotConfig={true} isDescription={true} onSave={(description) => updateBotConfig.mutate({ key: row.key, value: row.value, description })} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </ErrorBoundary>

      {/* Whale Wallets Section */}
      <ErrorBoundary>
        <div className="card bg-base-100 border border-base-300 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-semibold mb-4">Whale Wallets</h2>
            {whaleWalletsLoading ? (
              <div className="loading loading-spinner text-primary" />
            ) : !whaleWallets || whaleWallets.length === 0 ? (
              <p className="text-sm text-gray-500">No whale wallets found.</p>
            ) : (
              <>
                <table className="table table-sm w-full">
                  <thead className="bg-base-200">
                    <tr>
                      <th>Address</th>
                      <th>Description</th>
                      <th>Active</th>
                      <th>Added At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whaleWallets.map((row, i) => {
                      const [localAddress, setLocalAddress] = useState(row.address);
                      const [localDescription, setLocalDescription] = useState(row.description);
                      const [localActive, setLocalActive] = useState(row.active);
                      const save = (field: 'address' | 'description' | 'active') => {
                        updateWhale.mutate({
                          address: field === 'address' ? localAddress : row.address,
                          description: field === 'description' ? localDescription : row.description,
                          active: field === 'active' ? localActive : row.active,
                        });
                      };
                      return (
                        <tr key={i}>
                          <td>
                            <input
                              className="input input-sm input-bordered w-full"
                              value={localAddress}
                              onChange={(e) => setLocalAddress(e.target.value)}
                              onBlur={() => save('address')}
                            />
                          </td>
                          <td>
                            <input
                              className="input input-sm input-bordered w-full"
                              value={localDescription}
                              onChange={(e) => setLocalDescription(e.target.value)}
                              onBlur={() => save('description')}
                            />
                          </td>
                          <td>
                            <input
                              type="checkbox"
                              className="checkbox checkbox-sm"
                              checked={localActive}
                              onChange={(e) => {
                                setLocalActive(e.target.checked);
                                save('active');
                              }}
                            />
                          </td>
                          <td>{new Date(row.added_at).toLocaleString()}</td>
                          <td>
                            <button
                              className="btn btn-xs btn-error"
                              onClick={() => deleteWhale.mutate(row.address)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <div className="mt-4 flex gap-4 items-end">
                  <div className="form-control flex-1">
                    <label className="label text-sm">New Wallet Address</label>
                    <input
                      className="input input-sm input-bordered w-full"
                      value={newWhaleAddress}
                      onChange={(e) => setNewWhaleAddress(e.target.value)}
                      placeholder="Enter wallet address"
                    />
                  </div>
                  <div className="form-control flex-1">
                    <label className="label text-sm">Description</label>
                    <input
                      className="input input-sm input-bordered w-full"
                      value={newWhaleDescription}
                      onChange={(e) => setNewWhaleDescription(e.target.value)}
                      placeholder="Optional description"
                    />
                  </div>
                  <button className="btn btn-xs btn-outline" onClick={handleAddWhale}>
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Wallet
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </ErrorBoundary>

      {/* Trading Strategies Section */}
      <ErrorBoundary>
        <div className="card bg-base-100 border border-base-300 shadow-md">
          <div className="card-body">
            <h2 className="text-xl font-semibold mb-4">Trading Strategies</h2>
            {strategyConfigsLoading ? (
              <div className="loading loading-spinner text-primary" />
            ) : !strategyConfigs || strategyConfigs.length === 0 ? (
              <p className="text-sm text-gray-500">No strategy configurations found.</p>
            ) : (
              <>
                <div className="form-control mb-4">
                  <label className="label font-medium">Active Strategy</label>
                  <div className="flex gap-3">
                    {['trailing', 'simple'].map((type) => (
                      <label key={type} className="label cursor-pointer flex items-center gap-2">
                        <input
                          type="radio"
                          name="strategy"
                          className="radio radio-primary"
                          checked={activeStrategy === type}
                          onChange={() => {
                            setActiveStrategy(type);
                            updateStrategyConfig.mutate({ key: 'active_strategy', value: type });
                          }}
                        />
                        <span className="label-text capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {activeStrategy === 'trailing'
                      ? 'Advanced strategy with trailing stop loss, take profits, and capital recovery.'
                      : 'Simple strategy with fixed stop loss and take profit levels.'}
                  </p>
                </div>
                <h3 className="text-lg font-medium mb-2">
                  {activeStrategy.charAt(0).toUpperCase() + activeStrategy.slice(1)} Strategy Settings
                </h3>
                <table className="table table-sm w-full">
                  <thead className="bg-base-200">
                    <tr>
                      <th>Setting</th>
                      <th>Value</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeKeys.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="text-sm text-gray-500">
                          No settings found for {activeStrategy} strategy.
                        </td>
                      </tr>
                    ) : (
                      activeKeys.map((row, i) => (
                        <tr key={i}>
                          <td className="font-medium">
                            <div className="flex items-center gap-2">
                              {displayLabel(row.key)}
                              <div className="tooltip tooltip-right" data-tip={getTooltip(row.key)}>
                                <Info className="w-4 h-4 text-blue-400" />
                              </div>
                            </div>
                          </td>
                          <td>
                            {row.key.includes('take_profit_levels') || row.key.includes('take_profit_steps') ? (
                              <EditableTakeProfit row={row} onSave={(value) => updateStrategyConfig.mutate({ key: row.key, value })} />
                            ) : (
                              <EditableField row={row} onSave={(value) => updateStrategyConfig.mutate({ key: row.key, value })} />
                            )}
                          </td>
                          <td className="text-sm text-gray-500">{getTooltip(row.key)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}

export default BotConfigPage;
