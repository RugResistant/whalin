import { useQuery } from '@tanstack/react-query';

const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;

export interface TokenInsights {
  name?: string;
  symbol?: string;
  marketCap?: number;
  price?: number;
  holders?: number;
  volume?: number;
  createdAt?: string;
  ohlcv?: any[];
  swapVolumes?: any[];
  logs?: any[];
}

export function useTokenInsights(tokenMint: string) {
  return useQuery<TokenInsights>({
    queryKey: ['token-insights', tokenMint],
    queryFn: async () => {
      const headers = {
        'X-API-Key': MORALIS_API_KEY!,
        'Accept': 'application/json',
      };

      const [metaRes, holdersRes] = await Promise.all([
        fetch(`https://solana-gateway.moralis.io/token/mainnet/${tokenMint}`, { headers }),
        fetch(`https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/holders`, { headers }),
      ]);

      if (!metaRes.ok || !holdersRes.ok) {
        throw new Error(`Failed to fetch Moralis Solana data: ${metaRes.status} / ${holdersRes.status}`);
      }

      const meta = await metaRes.json();
      const holdersData = await holdersRes.json();

      return {
        name: meta.name || 'Unknown',
        symbol: meta.symbol || '',
        price: meta.price?.usd || 0,
        marketCap: meta.market_cap?.usd || (meta.price?.usd && meta.supply ? meta.price.usd * meta.supply : 0),
        holders: holdersData?.total || 0,
        volume: meta.volume_24h?.usd || 0,
        createdAt: meta.created_at || null,
        ohlcv: [],         // You can later enrich this
        swapVolumes: [],   // Optional
        logs: [],          // Optional
      };
    },
    enabled: !!tokenMint,
  });
}
