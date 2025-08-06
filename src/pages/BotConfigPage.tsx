import { useState, useEffect } from 'react';
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

function parseTakeProfit(value: string): { multiple?: number; ratio?: number; percent: number }[] {
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function displayLabel(key: string): string {
  const map: Record<string, string> = {
    trailing_initial_stop_loss_ratio: 'Initial Stop Loss %',
    trailing_recover_initial_at_multiple: 'Recover Capital At (x)',
    trailing_take_profit_levels: 'Take Profit Levels',
    trailing_activation_ratio: 'Trailing Activation (x)',
    trailing_cushion: 'Trailing Cushion %',

    simple_stop_loss_ratio: 'Stop Loss %',
    simple_take_profit_ratio: 'Take Profit (x)',
    simple_partial_sell_percent_at_take_profit: 'Partial Sell % at TP',
    simple_take_profit_steps: 'Take Profit Steps',
  };
  return map[key] || key;
}

function getTooltip(key: string): string {
  const tips: Record<string, string> = {
    trailing_initial_stop_loss_ratio: 'Sell if price drops below this % of buy price.',
    trailing_recover_initial_at_multiple: 'Sell portion at this multiple to recover principal.',
    trailing_take_profit_levels: 'E.g. [{ "multiple": 3, "percent": 30 }]',
    trailing_activation_ratio: 'Trailing stop activates after this x-multiple.',
    trailing_cushion: 'How much price must drop from peak to trigger sell.',

    simple_stop_loss_ratio: 'Sell if price drops below this % of buy.',
    simple_take_profit_ratio: 'Sell % of tokens at this multiple.',
    simple_partial_sell_percent_at_take_profit: 'What % to sell at TP ratio.',
    simple_take_profit_steps: 'E.g. [{ "ratio": 2, "percent": 30 }]',
  };
  return tips[key] || '';
}
function BotConfigPage() {
  const queryClient = useQueryClient();
  const [activeStrategy, setActiveStrategy] = useState('trailing');
  const [walletsState, setWalletsState] = useState<Record<string, string>>({});

  const { data: strategyConfigs = [] } = useQuery({
    queryKey: ['strategy_configs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('strategy_config').select('*');
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      const active = data.find((d) => d.key === 'active_strategy')?.value || 'trailing';
      setActiveStrategy(active);
      const wallets = data
        .filter((d) => d.key.startsWith('whale_wallet_'))
        .reduce((acc, curr) => ({ ...acc, [curr.key]: curr.value }), {});
      setWalletsState(wallets);
    },
  });

  const updateStrategyConfig = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: string }) => {
      const { error } = await supabase.from('strategy_config').upsert({ key, value });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['strategy_configs'] }),
  });

  const trailingKeys = strategyConfigs.filter(
    (cfg) => cfg.key.startsWith('trailing_') && activeStrategy === 'trailing'
  );

  const simpleKeys = strategyConfigs.filter(
    (cfg) => cfg.key.startsWith('simple_') && activeStrategy === 'simple'
  );

  const renderEditableRow = (row: any) => {
    const key = row.key;
    const rawValue = row.value;
    const [localValue, setLocalValue] = useState(rawValue);
    const [dirty, setDirty] = useState(false);

    const save = () => {
      updateStrategyConfig.mutate({ key, value: localValue });
      setDirty(false);
    };

    if (key.includes('take_profit_levels') || key.includes('take_profit_steps')) {
      const parsed = parseTakeProfit(rawValue);
      return (
        <div className="flex flex-col gap-2">
          {parsed.map((tp, idx) => (
            <div key={idx} className="flex gap-2 items-center">
              <input
                type="number"
                className="input input-sm input-bordered w-24"
                value={tp.multiple ?? tp.ratio ?? ''}
                onChange={(e) => {
                  const updated = [...parsed];
                  if ('multiple' in tp) updated[idx].multiple = parseFloat(e.target.value);
                  if ('ratio' in tp) updated[idx].ratio = parseFloat(e.target.value);
                  setLocalValue(JSON.stringify(updated));
                  setDirty(true);
                }}
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
              />
            </div>
          ))}
          <button
            className="btn btn-xs btn-outline"
            onClick={() => {
              const field = key.includes('step') ? 'ratio' : 'multiple';
              setLocalValue(JSON.stringify([...parsed, { [field]: 2, percent: 10 }]));
              setDirty(true);
            }}
          >
            + Add
          </button>
          {dirty && (
            <div className="mt-1 flex items-center gap-2">
              <Save className="w-4 h-4 text-green-500" />
              <button className="btn btn-xs btn-primary" onClick={save}>
                Save
              </button>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          step="any"
          className="input input-sm input-bordered w-32"
          value={localValue}
          onChange={(e) => {
            setLocalValue(e.target.value);
            setDirty(true);
          }}
          onBlur={() => {
            if (dirty && localValue !== rawValue) {
              save();
            }
          }}
        />
        {dirty && <Save className="w-4 h-4 text-green-500" />}
      </div>
    );
  };
  return (
    <div className="max-w-5xl mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3">
        <Settings className="w-6 h-6 text-primary" />
        <h1 className="text-3xl font-bold">Bot Sell Strategy Configuration</h1>
      </div>

      <div className="flex gap-3 items-center">
        <span className="font-medium">Active Strategy:</span>
        <button
          className={`btn btn-sm ${activeStrategy === 'trailing' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() =>
            updateStrategyConfig.mutate({ key: 'active_strategy', value: 'trailing' })
          }
        >
          Trailing
        </button>
        <button
          className={`btn btn-sm ${activeStrategy === 'simple' ? 'btn-primary' : 'btn-outline'}`}
          onClick={() =>
            updateStrategyConfig.mutate({ key: 'active_strategy', value: 'simple' })
          }
        >
          Simple
        </button>
      </div>

      {/* Strategy Settings */}
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body">
          <h2 className="text-xl font-semibold mb-4">
            {activeStrategy === 'trailing'
              ? 'Trailing Strategy Settings'
              : 'Simple Strategy Settings'}
          </h2>
          <table className="table table-sm w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Setting</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {(activeStrategy === 'trailing' ? trailingKeys : simpleKeys).map((row, i) => (
                <tr key={i}>
                  <td className="flex items-center gap-2 font-medium">
                    {displayLabel(row.key)}
                    <div className="tooltip tooltip-right" data-tip={getTooltip(row.key)}>
                      <Info className="w-4 h-4 text-blue-400" />
                    </div>
                  </td>
                  <td>{renderEditableRow(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Global Configs */}
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body">
          <h2 className="text-xl font-semibold mb-4">Global Settings</h2>
          <table className="table table-sm w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Setting</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {strategyConfigs
                .filter(
                  (cfg) =>
                    !cfg.key.startsWith('trailing_') &&
                    !cfg.key.startsWith('simple_') &&
                    cfg.key !== 'active_strategy' &&
                    !cfg.key.startsWith('whale_wallet_')
                )
                .map((row, i) => (
                  <tr key={i}>
                    <td className="font-medium">{row.key}</td>
                    <td>{renderEditableRow(row)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Whale Wallets */}
      <div className="card bg-base-100 border border-base-300 shadow-md">
        <div className="card-body">
          <h2 className="text-xl font-semibold mb-4">Whale Wallets</h2>
          <table className="table table-sm w-full">
            <thead className="bg-base-200">
              <tr>
                <th>Index</th>
                <th>Wallet Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(walletsState).map(([key, value], i) => (
                <tr key={i}>
                  <td>{key.replace('whale_wallet_', '')}</td>
                  <td>
                    <input
                      className="input input-sm input-bordered w-full"
                      value={value}
                      onChange={(e) =>
                        setWalletsState({ ...walletsState, [key]: e.target.value })
                      }
                      onBlur={() =>
                        updateStrategyConfig.mutate({ key, value: walletsState[key] })
                      }
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-xs btn-error"
                      onClick={async () => {
                        await supabase.from('strategy_config').delete().eq('key', key);
                        queryClient.invalidateQueries({ queryKey: ['strategy_configs'] });
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button
            className="btn btn-sm btn-outline mt-3"
            onClick={() => {
              const newKey = `whale_wallet_${Date.now()}`;
              updateStrategyConfig.mutate({ key: newKey, value: '' });
            }}
          >
            <PlusCircle className="w-4 h-4 mr-2" />
            Add Wallet
          </button>
        </div>
      </div>
    </div>
  );
}

export default BotConfigPage;
