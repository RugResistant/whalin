import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { TokenInsight } from '@/types/TokenInsight';

export function useTokenInsights(tokenMint?: string) {
  return useQuery<TokenInsight | null>({
    queryKey: ['token-insight', tokenMint],
    queryFn: async () => {
      if (!tokenMint) return null;

      const { data: meta } = await supabase
        .from('ever_bought_tokens')
        .select('*')
        .eq('token_mint', tokenMint)
        .maybeSingle();

      const { data: logs } = await supabase
        .from('bot_logs')
        .select('*')
        .eq('token_mint', tokenMint)
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: ohlcv } = await supabase
        .from('ohlcv')
        .select('*')
        .eq('token_mint', tokenMint)
        .order('time', { ascending: true });

      const { data: swapVolumes } = await supabase
        .from('volume')
        .select('*')
        .eq('token_mint', tokenMint)
        .order('time', { ascending: true });

      if (!meta) return null;

      return {
        token_mint: meta.token_mint,
        name: meta.name,
        symbol: meta.symbol,
        price: meta.price,
        marketCap: meta.marketCap,
        holders: meta.holders,
        createdAt: meta.createdAt,
        volume: meta.volume,
        logs: logs ?? [],
        ohlcv: ohlcv ?? [],
        swapVolumes: swapVolumes ?? [],
      };
    },
  });
}
