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
      if (!MORALIS_API_KEY) throw new Error('Missing Moralis API key');

      const headers = {
        'X-API-Key': MORALIS_API_KEY,
        'Accept': 'application/json',
      };

      const [metaRes, holdersRes] = await Promise.all([
        fetch(`https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/metadata`, { headers }),
        fetch(`https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/holders`, { headers }),
      ]);

      if (!metaRes.ok || !holdersRes.ok) {
        const msg = `Metadata: ${metaRes.status}, Holders: ${holdersRes.status}`;
        throw new Error(`Failed to fetch Moralis token data — ${msg}`);
      }

      const meta = await metaRes.json();
      const holders = await holdersRes.json();

      return {
        name: meta?.name ?? 'Unknown',
        symbol: meta?.symbol ?? '',
        price: meta?.price_usd ?? 0,
        marketCap: meta?.market_cap_usd ?? 0,
        holders: holders?.total ?? 0,
        volume: meta?.volume_24h_usd ?? 0,
        createdAt: meta?.createdAt ?? null,
        ohlcv: [],
        swapVolumes: [],
        logs: [],
      };
    },
    enabled: !!tokenMint,
  });
}
