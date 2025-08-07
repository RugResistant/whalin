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
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { cn } from '../lib/utils';
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
    trailing_initial_stop_loss_ratio: 'Sell if Price Drops By',
    trailing_recover_initial_at_multiple: 'Recover Initial Investment At',
    trailing_take_profit_levels: 'Take Profit Levels',
    trailing_activation_ratio: 'Start Trailing Stop At',
    trailing_cushion: 'Trailing Stop Drop',
    simple_stop_loss_ratio: 'Sell if Price Drops By',
    simple_take_profit_ratio: 'Take Profit At',
    simple_partial_sell_percent_at_take_profit: 'Sell Percentage at Take Profit',
    simple_take_profit_steps: 'Additional Take Profit Levels',
    active_strategy: 'Active Trading Strategy',
  };
  return map[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}
function getTooltip(key: string): string {
  const tips: Record<string, string> = {
    active_strategy: 'Choose how the bot decides when to sell tokens. "Trailing" strategy adjusts the sell price dynamically as the token price rises, while "Simple" uses fixed profit and loss targets. Example: Trailing might sell after a 20% drop from a peak, while Simple sells at a fixed 50% profit.',
    trailing_initial_stop_loss_ratio: 'If the token price drops by this percentage from your buy price, sell all tokens to limit losses. Example: Set to 25% (0.75) to sell if the price falls to 75% of what you paid.',
    trailing_recover_initial_at_multiple: 'When the token price reaches this multiple of your buy price, sell just enough to recover your initial investment. Example: Set to 2 to sell a portion at 2x your buy price. Enter "null" (without quotes) to disable this feature.',
    trailing_take_profit_levels: 'Sell a percentage of your tokens when the price reaches specified multiples of your buy price. Example: Sell 50% at 2x and 30% at 3x to lock in profits gradually.',
    trailing_activation_ratio: 'When the token price reaches this multiple of your buy price, the bot starts a trailing stop, which tracks the highest price and sells if it drops too far. Example: Set to 1.2 to start trailing at 20% profit.',
    trailing_cushion: 'After the trailing stop starts, sell all tokens if the price drops by this percentage from its highest point. Example: Set to 20% (0.2) to sell if the price falls 20% from the peak.',
    simple_stop_loss_ratio: 'If the token price drops by this percentage from your buy price, sell all tokens to limit losses. Example: Set to 20% (0.8) to sell if the price falls to 80% of what you paid.',
    simple_take_profit_ratio: 'When the token price reaches this multiple of your buy price, sell the specified percentage of your tokens. Example: Set to 1.5 to sell at 50% profit.',
    simple_partial_sell_percent_at_take_profit: 'The percentage of your tokens to sell when the take profit level is reached. Example: Set to 90 to sell 90% of your tokens at the take profit price.',
    simple_take_profit_steps: 'Sell additional percentages of your tokens at higher price multiples. Example: Sell 50% at 3x and 30% at 5x to secure more profits as the price rises.',
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
      return <div className="alert alert-error shadow-lg">Something went wrong. Please refresh or check your data.</div>;
    }
    return this.props.children;
  }
}
function EditableField({ row, isBotConfig = false, isDescription = false, onSave }: { row: StrategyRow | BotConfigRow, isBotConfig?: boolean, isDescription?: boolean, onSave: (value: string) => void }) {
  const key = row.key;
  const rawValue = isDescription ? (row as BotConfigRow).description : row.value;
  const [localValue, setLocalValue] = useState(rawValue);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const validateInput = (value: string): string | null => {
    if (key === 'trailing_recover_initial_at_multiple') {
      const trimmed = value.trim().toLowerCase();
      if (trimmed === 'null') {
        return null; // Valid
      } else {
        const num = parseFloat(value);
        if (isNaN(num) || num <= 0) {
          return 'Must be a positive number (e.g., 2 for 2x) or "null" to disable';
        }
        return null; // Valid number
      }
    }
    if (key === 'active_strategy') {
      if (!['trailing', 'simple'].includes(value.toLowerCase())) {
        return 'Must be "trailing" or "simple"';
      }
      return null;
    }
    if (key.includes('ratio') || key.includes('multiple') || key.includes('cushion')) {
      const num = parseFloat(value);
      if (isNaN(num) || num <= 0) {
        return 'Must be a positive number (e.g., 0.75 for 25% loss or 1.2 for 20% profit)';
      }
      if (key.includes('stop_loss_ratio') && num >= 1) {
        return 'Must be less than 1 to sell at a loss (e.g., 0.8 for 20% loss)';
      }
      if (key.includes('cushion') && num > 0.5) {
        return 'Cushion should be a small percentage (e.g., 0.2 for 20% drop)';
      }
    }
    if (key.includes('percent') && !key.includes('take_profit')) {
      const num = parseFloat(value);
      if (isNaN(num) || num < 0 || num > 100) {
        return 'Must be between 0 and 100 (e.g., 90 for 90% of tokens)';
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
        type={
          key === 'trailing_recover_initial_at_multiple'
            ? (localValue === 'null' ? 'text' : 'number')
            : (key.includes('percent') || key.includes('ratio') || key.includes('multiple') || key.includes('cushion') ? 'number' : 'text')
        }
        step={
          key === 'trailing_recover_initial_at_multiple' && localValue === 'null'
            ? undefined
            : (key.includes('percent') ? '1' : '0.01')
        }
        min={
          key === 'trailing_recover_initial_at_multiple' && localValue === 'null'
            ? undefined
            : (key.includes('percent') ? '0' : key.includes('stop_loss_ratio') ? '0' : key === 'active_strategy' ? undefined : '0')
        }
        max={
          key === 'trailing_recover_initial_at_multiple' && localValue === 'null'
            ? undefined
            : (key.includes('percent') ? '100' : key.includes('cushion') ? '0.5' : undefined)
        }
        className={cn('input input-sm input-bordered w-48', error && 'input-error')}
        value={localValue}
        disabled={key === 'trailing_recover_initial_at_multiple' && localValue === 'null'}
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
        placeholder={key === 'active_strategy' ? 'trailing or simple' : (key === 'trailing_recover_initial_at_multiple' && localValue === 'null' ? 'Disabled' : 'Number or null')}
      />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
      {dirty && <button className="btn btn-xs btn-success mt-1" onClick={save}><Save className="w-4 h-4" /> Save</button>}
      {key === 'trailing_recover_initial_at_multiple' && (
        localValue !== 'null' ? (
          <button className="btn btn-xs btn-warning mt-1" onClick={() => { setLocalValue('null'); save(); }}>Disable Recovery</button>
        ) : (
          <button className="btn btn-xs btn-success mt-1" onClick={() => { setLocalValue('2'); save(); }}>Enable Recovery</button>
        )
      )}
    </div>
  );
}
function EditableTakeProfit({ row, onSave }: { row: StrategyRow, onSave: (value: string) => void }) {
  const [localValue, setLocalValue] = useState(row.value);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const parsed = parseTakeProfit(localValue);
  const save = () => {
    try {
      JSON.parse(localValue);
      onSave(localValue);
      setError(null);
      setDirty(false);
    } catch (e) {
      setError('Invalid JSON format for profit levels');
    }
  };
  return (
    <div className="card bg-base-200 shadow-sm p-4">
      <div className="text-sm font-medium mb-2">Profit Levels</div>
      {parsed.length === 0 && <p className="text-sm text-gray-500">No profit levels set. Add one below.</p>}
      {parsed.map((tp, idx) => (
        <div key={idx} className="flex gap-3 items-center mb-2">
          <div className="form-control w-28">
            <label className="label text-xs">Price Multiple</label>
            <input
              type="number"
              step="0.1"
              min="1"
              className={cn('input input-xs input-bordered', error && 'input-error')}
              value={tp.multiple ?? tp.ratio ?? 1}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 1) {
                  setError('Price multiple must be at least 1 (e.g., 1.2 for 20% profit)');
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
          <div className="form-control w-28">
            <label className="label text-xs">Sell %</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              className={cn('input input-xs input-bordered', error && 'input-error')}
              value={tp.percent ?? 0}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                if (isNaN(value) || value < 0 || value > 100) {
                  setError('Sell percentage must be between 0 and 100');
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
        <PlusCircle className="w-4 h-4 mr-1" /> Add Profit Level
      </button>
      {error && <p className="text-xs text-error mt-2">{error}</p>}
      {dirty && (
        <button className="btn btn-xs btn-primary mt-2" onClick={save}>
          <Save className="w-4 h-4 mr-1" /> Save Levels
        </button>
      )}
    </div>
  );
}
function WhaleRow({
  row,
  updateWhale,
  deleteWhale,
}: {
  row: WhaleRow;
  updateWhale: any;
  deleteWhale: any;
}) {
  const [localAddress, setLocalAddress] = useState(row.address);
  const [localDescription, setLocalDescription] = useState(row.description);
  const [localActive, setLocalActive] = useState(row.active);
  const [error, setError] = useState<string | null>(null);
  const save = (field: 'address' | 'description' | 'active') => {
    if (field === 'address' && localAddress.length < 32) {
      setError('Wallet address must be a valid Solana address (at least 32 characters)');
      return;
    }
    updateWhale.mutate({
      address: field === 'address' ? localAddress : row.address,
      description: field === 'description' ? localDescription : row.description,
      active: field === 'active' ? localActive : row.active,
    });
    setError(null);
  };
  return (
    <tr>
      <td>
        <input
          className={cn('input input-sm input-bordered w-full', error && 'input-error')}
          value={localAddress}
          onChange={(e) => setLocalAddress(e.target.value)}
          onBlur={() => save('address')}
          placeholder="Enter Solana address"
        />
        {error && <p className="text-xs text-error mt-1">{error}</p>}
      </td>
      <td>
        <input
          className="input input-sm input-bordered w-full"
          value={localDescription}
          onChange={(e) => setLocalDescription(e.target.value)}
          onBlur={() => save('description')}
          placeholder="Optional description"
        />
      </td>
      <td>
        <input
          type="checkbox"
          className="checkbox checkbox-sm checkbox-primary"
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
}
function BotConfigPage() {
  const queryClient = useQueryClient();
  const [activeStrategy, setActiveStrategy] = useState<string>('trailing');
  const [newWhaleAddress, setNewWhaleAddress] = useState('');
  const [newWhaleDescription, setNewWhaleDescription] = useState('');
  const [showBotConfigs, setShowBotConfigs] = useState(false);
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
      if (address.length < 32) throw new Error('Invalid Solana address');
      const { error } = await supabase.from('whale_wallets').insert({ address, active: true, description });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whale_wallets'] });
      setNewWhaleAddress('');
      setNewWhaleDescription('');
    },
    onError: (error) => {
      alert(`Failed to add wallet: ${error.message}`);
    },
  });
  const updateStrategyConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const current = strategyConfigsRaw?.find((cfg) => cfg.key === key);
      const { error } = await supabase.from('strategy_config').upsert({
        key,
        value,
        description: current?.description ?? getTooltip(key),
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategy_configs'] }),
  });
  const strategyConfigs: StrategyRow[] = strategyConfigsRaw ?? [];
  const activeKeys = strategyConfigs.filter((cfg) =>
    cfg.key.startsWith(activeStrategy === 'trailing' ? 'trailing_' : 'simple_')
  );
  const handleAddWhale = () => {
    if (newWhaleAddress) {
      addWhale.mutate({ address: newWhaleAddress, description: newWhaleDescription });
    }
  };
  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-primary" />
        <h1 className="text-3xl font-bold">Bot Settings</h1>
      </div>
      <div className="alert alert-info shadow-lg">
        <div>
          <Info className="w-6 h-6" />
          <span>
            Configure your trading bot here. Set your trading strategy first, then manage whale wallets and general settings. Changes save automatically. Hover over <Info className="w-4 h-4 inline" /> icons for help.
          </span>
        </div>
      </div>
      {/* Trading Strategy Section */}
      <ErrorBoundary>
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <h2 className="text-lg font-semibold mb-4">Trading Strategy</h2>
            <p className="text-sm text-gray-500 mb-4">
              Choose how the bot sells tokens after buying them. The "Trailing" strategy adjusts sell points as prices rise, while "Simple" uses fixed profit and loss targets. Only the active strategy's settings are shown to prevent mistakes.
            </p>
            {strategyConfigsLoading ? (
              <div className="loading loading-spinner loading-md text-primary" />
            ) : !strategyConfigs || strategyConfigs.length === 0 ? (
              <p className="text-sm text-gray-500">No strategy settings found. Contact support.</p>
            ) : (
              <>
                <div className="form-control mb-6">
                  <label className="label font-medium text-sm">Choose Active Strategy <Info className="w-4 h-4 inline ml-1" data-tip={getTooltip('active_strategy')} /></label>
                  <div className="flex gap-4">
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
                        <span className="label-text capitalize font-medium">{type}</span>
                        <span className="badge badge-outline badge-sm">{type === 'trailing' ? 'Dynamic, tracks price peaks' : 'Fixed profit/loss targets'}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <h3 className="text-md font-medium mb-3">{activeStrategy.charAt(0).toUpperCase() + activeStrategy.slice(1)} Strategy Settings</h3>
                <table className="table w-full">
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
      {/* Whale Wallets Section */}
      <ErrorBoundary>
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <h2 className="text-lg font-semibold mb-4">Whale Wallets to Follow</h2>
            <p className="text-sm text-gray-500 mb-4">
              Add Solana wallet addresses of big traders ("whales") you want the bot to copy. When they buy a token, the bot will try to buy it too. Toggle "Active" to enable/disable copying.
            </p>
            {whaleWalletsLoading ? (
              <div className="loading loading-spinner loading-md text-primary" />
            ) : !whaleWallets || whaleWallets.length === 0 ? (
              <p className="text-sm text-gray-500">No whale wallets added yet.</p>
            ) : (
              <>
                <table className="table w-full">
                  <thead className="bg-base-200">
                    <tr>
                      <th>Wallet Address</th>
                      <th>Description</th>
                      <th>Active</th>
                      <th>Added On</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {whaleWallets.map((row) => (
                      <WhaleRow
                        key={row.address}
                        row={row}
                        updateWhale={updateWhale}
                        deleteWhale={deleteWhale}
                      />
                    ))}
                  </tbody>
                </table>
                <div className="divider">Add New Whale</div>
                <div className="flex gap-4 items-end">
                  <div className="form-control flex-1">
                    <label className="label text-sm font-medium">Wallet Address</label>
                    <input
                      className="input input-sm input-bordered w-full"
                      value={newWhaleAddress}
                      onChange={(e) => setNewWhaleAddress(e.target.value)}
                      placeholder="Enter Solana wallet address"
                    />
                  </div>
                  <div className="form-control flex-1">
                    <label className="label text-sm font-medium">Description (Optional)</label>
                    <input
                      className="input input-sm input-bordered w-full"
                      value={newWhaleDescription}
                      onChange={(e) => setNewWhaleDescription(e.target.value)}
                      placeholder="E.g., Top trader on Raydium"
                    />
                  </div>
                  <button className="btn btn-sm btn-primary" onClick={handleAddWhale}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Add Wallet
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </ErrorBoundary>
      {/* General Bot Settings Section */}
      <ErrorBoundary>
        <div className="card bg-base-100 border border-base-300 shadow-lg">
          <div className="card-body">
            <button
              className="flex items-center gap-2 text-lg font-semibold mb-4"
              onClick={() => setShowBotConfigs(!showBotConfigs)}
            >
              <h2>General Bot Settings</h2>
              {showBotConfigs ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {showBotConfigs && (
              <>
                <p className="text-sm text-gray-500 mb-4">
                  These settings control how the bot operates, like transaction fees, retry limits, and how much SOL to spend per trade. Adjust carefully, as they affect all trades.
                </p>
                {botConfigsLoading ? (
                  <div className="loading loading-spinner loading-md text-primary" />
                ) : !botConfigs || botConfigs.length === 0 ? (
                  <p className="text-sm text-gray-500">No settings found. Contact support.</p>
                ) : (
                  <table className="table w-full">
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
                            <EditableField
                              row={row}
                              isBotConfig={true}
                              isDescription={false}
                              onSave={(value) => updateBotConfig.mutate({ key: row.key, value, description: row.description })}
                            />
                          </td>
                          <td>
                            <EditableField
                              row={row}
                              isBotConfig={true}
                              isDescription={true}
                              onSave={(description) => updateBotConfig.mutate({ key: row.key, value: row.value, description })}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </>
            )}
          </div>
        </div>
      </ErrorBoundary>
    </div>
  );
}
export default BotConfigPage;
