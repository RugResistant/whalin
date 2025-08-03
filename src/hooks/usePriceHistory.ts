// src/hooks/usePriceHistory.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export function usePriceHistory(tokenMint: string | undefined) {
  const [data, setData] = useState<{ price: number; timestamp: string }[]>([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<null | string>(null);

  useEffect(() => {
    if (!tokenMint) return;

    const fetchHistory = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('price_snapshots')
        .select('price, timestamp')
        .eq('token_mint', tokenMint)
        .gte('timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setData(data || []);
        setLoading(false);
      }
    };

    fetchHistory();
  }, [tokenMint]);

  return { data, isLoading, error };
}
