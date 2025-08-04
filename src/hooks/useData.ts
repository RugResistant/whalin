import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { enrichTokenMint } from '../lib/moralis';

export function useHeartbeat() {
  return useQuery({
    queryKey: ['heartbeat'],
    queryFn: async () => {
      const { data } = await supabase.from('bot_heartbeat').select('*').eq('instance_id', 'bot_instance_1').single();
      return data ?? null;
    },
  });
}

export function useTrackedTokens() {
  return useQuery({
    queryKey: ['tracked_tokens'],
    queryFn: async () => {
      const { data } = await supabase.from('tracked_tokens').select('*').order('bought_at', { ascending: false });
      if (!data) return [];
      return Promise.all(data.map(async (row) => ({ ...row, enriched: await enrichTokenMint(row.token_mint) })));
    },
  });
}

export function useTrades() {
  return useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      const { data } = await supabase.from('trades').select('*').order('sell_timestamp', { ascending: false });
      if (!data) return [];
      return Promise.all(data.map(async (row) => ({ ...row, enriched: await enrichTokenMint(row.token_mint) })));
    },
  });
}

export function useLogs() {
  return useQuery({
    queryKey: ['logs'],
    queryFn: async () => {
      const { data } = await supabase.from('bot_logs').select('*').order('created_at', { ascending: false }).limit(100);
      return data ?? [];
    },
  });
}

export function useEverBought() {
  return useQuery({
    queryKey: ['ever_bought'],
    queryFn: async () => {
      const { data } = await supabase.from('ever_bought_tokens').select('*').order('created_at', { ascending: false });
      if (!data) return [];
      return Promise.all(data.map(async (row) => ({ ...row, enriched: await enrichTokenMint(row.token_mint) })));
    },
  });
}
