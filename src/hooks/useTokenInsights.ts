// src/hooks/useTokenInsights.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface TokenInsight {
  token_mint: string;
  name?: string;
  symbol?: string;
  price?: number;
  marketCap?: number;
  holders?: number;
  createdAt?: string;
  volume?: number;
  logs?: {
    type: string;
    message: string;
    created_at: string;
  }[];
  ohlcv?: {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
  }[];
  swapVolumes?: {
    time: string;
    volume: number;
  }[];
}

export function useTokenInsights(tokenMint?: string) {
  return useQuery<TokenInsight | null>({
    queryKey: ['tokenInsights', tokenMint],
    enabled: !!tokenMint,
    queryFn: async () => {
      if (!tokenMint) return null;

      const [{ data: token }, { data: logs }, { data: ohlcv }, { data: volume }] = await Promise.all([
        supabase.from('tracked_tokens').select('*').eq('token_mint', tokenMint).maybeSingle(),
        supabase.from('bot_logs').select('*').eq('token', tokenMint).order('created_at', { ascending: false }).limit(50),
        supabase.from('ohlcv').select('*').eq('token', tokenMint).order('time', { ascending: true }),
        supabase.from('volume').select('*').eq('token', tokenMint).order('time', { ascending: true }),
      ]);

      if (!token) throw new Error('Token not found');

      return {
        token_mint: tokenMint,
        name: token.name,
        symbol: token.symbol,
        price: token.price,
        marketCap: token.market_cap,
        holders: token.holder_count,
        createdAt: token.created_at,
        volume: volume?.reduce((acc, cur) => acc + (cur.volume ?? 0), 0),
        logs,
        ohlcv,
        swapVolumes: volume,
      };
    },
  });
}
