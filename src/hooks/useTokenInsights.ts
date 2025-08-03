// src/hooks/useTokenInsights.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase'; // Matches your supabase.ts

export function useTokenInsights(tokenMint?: string) {
  return useQuery({
    queryKey: ['token-insights', tokenMint],
    enabled: !!tokenMint,
    queryFn: async () => {
      if (!tokenMint) throw new Error('Missing token mint');

      const [metaRes, logRes, volumeRes, ohlcvRes] = await Promise.all([
        supabase.from('ever_bought_tokens')
          .select('*')
          .eq('token_mint', tokenMint)
          .maybeSingle(),

        supabase.from('bot_logs')
          .select('*')
          .eq('token_mint', tokenMint)
          .order('created_at', { ascending: false })
          .limit(10),

        supabase.from('swap_volume')
          .select('*')
          .eq('token_mint', tokenMint)
          .order('time', { ascending: true })
          .limit(24),

        supabase.from('ohlcv')
          .select('*')
          .eq('token_mint', tokenMint)
          .order('time', { ascending: true })
          .limit(48),
      ]);

      const meta = metaRes.data ?? {};
      const logs = logRes.data ?? [];
      const swapVolumes = (volumeRes.data ?? []).map(v => ({
        ...v,
        volume: parseFloat(v.volume),
        time: v.time
      }));

      const ohlcv = (ohlcvRes.data ?? []).map(d => ({
        ...d,
        close: parseFloat(d.close),
        time: d.time
      }));

      return {
        symbol: meta.symbol || 'UNK',
        name: meta.name || 'Unknown',
        marketCap: meta.market_cap || 0,
        holders: meta.holders || 0,
        price: meta.price || 0,
        createdAt: meta.created_at,
        volume: swapVolumes.reduce((sum, v) => sum + v.volume, 0),
        swapVolumes,
        ohlcv,
        logs,
      };
    }
  });
}