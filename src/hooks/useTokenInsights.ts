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
        fetch(`https://deep-index.moralis.io/api/v2.2/erc20/metadata?chain=solana&addresses[]=${tokenMint}`, { headers }),
        fetch(`https://deep-index.moralis.io/api/v2.2/erc20/${tokenMint}/holders?chain=solana`, { headers }),
      ]);

      if (!metaRes.ok || !holdersRes.ok) {
        throw new Error('Failed to fetch Moralis token data');
      }

      const metaData = await metaRes.json();
      const holdersData = await holdersRes.json();

      const meta = metaData?.[0] || {};

      return {
        name: meta.name || 'Unknown',
        symbol: meta.symbol || '',
        price: meta.usdPrice || 0,
        marketCap: meta.marketCapUsd || (meta.usdPrice && meta.totalSupply ? meta.usdPrice * meta.totalSupply : 0),
        holders: holdersData?.total || 0,
        volume: meta.total24hVolumeUsd || 0,
        createdAt: meta.createdAt || null,
        ohlcv: [],
        swapVolumes: [],
        logs: [],
      };
    },
    enabled: !!tokenMint,
  });
}
