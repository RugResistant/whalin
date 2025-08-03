import { useQuery } from '@tanstack/react-query';

const MORALIS_API_KEY = import.meta.env.VITE_MORALIS_API_KEY;
const BASE_URL = 'https://solana-gateway.moralis.io';

export interface TokenInsights {
  name?: string;
  symbol?: string;
  price?: number;
  marketCap?: number;
  holders?: number;
  createdAt?: string;
  volume?: number;
  ohlcv?: {
    timestamp: string;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }[];
  logs?: any[];
  swapVolumes?: any[];
}

export function useTokenInsights(tokenMint: string) {
  return useQuery<TokenInsights>({
    queryKey: ['token-insights', tokenMint],
    queryFn: async () => {
      const headers = {
        'accept': 'application/json',
        'X-API-Key': MORALIS_API_KEY!,
      };

      // 1. Get metadata
      const metaRes = await fetch(
        `${BASE_URL}/token/mainnet/${tokenMint}/metadata`,
        { headers }
      );
      if (!metaRes.ok) throw new Error('Failed to fetch metadata');
      const meta = await metaRes.json();

      // 2. Get holders
      const holdersRes = await fetch(
        `${BASE_URL}/token/mainnet/holders/${tokenMint}`,
        { headers }
      );
      const holdersData = holdersRes.ok ? await holdersRes.json() : null;

      // 3. Get pairs
      const pairsRes = await fetch(
        `${BASE_URL}/token/mainnet/${tokenMint}/pairs`,
        { headers }
      );
      const pairsData = pairsRes.ok ? await pairsRes.json() : null;
      const firstPair = pairsData?.pairs?.[0];
      const pairAddress = firstPair?.pairAddress;

      // 4. Get OHLCV for the first pair (if available)
      let ohlcvData = [];
      if (pairAddress) {
        const now = new Date();
        const fromDate = new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString().split('T')[0];
        const toDate = now.toISOString().split('T')[0];

        const ohlcvRes = await fetch(
          `${BASE_URL}/token/mainnet/pairs/${pairAddress}/ohlcv?timeframe=1h&currency=usd&fromDate=${fromDate}&toDate=${toDate}&limit=24`,
          { headers }
        );

        if (ohlcvRes.ok) {
          const ohlcvJson = await ohlcvRes.json();
          ohlcvData = ohlcvJson.result || [];
        }
      }

      return {
        name: meta.name || 'Unknown',
        symbol: meta.symbol || '',
        price: parseFloat(firstPair?.usdPrice || meta.fullyDilutedValue || '0'),
        marketCap: parseFloat(meta.fullyDilutedValue || '0'),
        holders: holdersData?.totalHolders || 0,
        createdAt: meta.metaplex?.createdAt || null,
        volume: ohlcvData?.[ohlcvData.length - 1]?.volume || 0,
        ohlcv: ohlcvData,
        logs: [],
        swapVolumes: [],
      };
    },
    enabled: !!tokenMint,
    staleTime: 1000 * 60, // 1 minute
  });
}
