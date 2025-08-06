import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

interface WhaleWalletRowProps {
  row: { key: string; value: string };
  updateStrategyConfig: any;
  queryClient: any;
}

export function WhaleWalletRow({
  row,
  updateStrategyConfig,
  queryClient,
}: WhaleWalletRowProps) {
  const [local, setLocal] = useState(row.value);

  const deleteRow = async () => {
    await supabase.from('strategy_config').delete().eq('key', row.key);
    queryClient.invalidateQueries({ queryKey: ['strategy_configs'] });
  };

  return (
    <div className="flex items-center gap-4 mt-2">
      <input
        className="input input-sm input-bordered w-full"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        onBlur={() =>
          updateStrategyConfig.mutate({ key: row.key, value: local })
        }
      />
      <button className="btn btn-xs btn-error" onClick={deleteRow}>
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
