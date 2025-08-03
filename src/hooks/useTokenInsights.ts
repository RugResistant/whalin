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
  pairAddress?: string;
}
export function useTokenInsights(tokenMint: string) {
  return useQuery<TokenInsights>({
    queryKey: ['token-insights', tokenMint],
    queryFn: async () => {
      if (!tokenMint || tokenMint.length < 32) {
        throw new Error(`Invalid tokenMint: ${tokenMint}`);
      }
      const headers = {
        accept: 'application/json',
        'X-API-Key': MORALIS_API_KEY!,
      };
      // Fetch metadata (basic info like name, symbol, createdAt)
      const metaRes = await fetch(
        `https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/metadata`,
        { headers }
      );
      if (!metaRes.ok) {
        const error = await metaRes.json().catch(() => ({}));
        throw new Error(`Moralis metadata error: ${error.message || metaRes.status}`);
      }
      const meta = await metaRes.json();

      // Fetch price data (price, market cap, volume)
      const priceRes = await fetch(
        `https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/price`,
        { headers }
      );
      if (!priceRes.ok) {
        const error = await priceRes.json().catch(() => ({}));
        throw new Error(`Moralis price error: ${error.message || priceRes.status}`);
      }
      const priceData = await priceRes.json();

      // Fetch holders (can fail silently)
      let holders = 0;
      try {
        const holdersRes = await fetch(
          `https://solana-gateway.moralis.io/token/mainnet/holders/${tokenMint}`,
          { headers }
        );
        if (holdersRes.ok) {
          const holdersData = await holdersRes.json();
          holders = holdersData.totalHolders || 0;
        }
      } catch (_) {}

      // Fetch pairs to get pair address (for OHLCV)
      let pairAddress: string | undefined = undefined;
      try {
        const pairRes = await fetch(
          `https://solana-gateway.moralis.io/token/mainnet/${tokenMint}/pairs`,
          { headers }
        );
        if (pairRes.ok) {
          const pairData = await pairRes.json();
          if (Array.isArray(pairData.pairs) && pairData.pairs.length > 0) {
            pairAddress = pairData.pairs[0].pairAddress;
          }
        }
      } catch (_) {}

      // Fetch OHLCV data if we have a valid pair
      let ohlcv: any[] = [];
      if (pairAddress) {
        const ohlcvRes = await fetch(
          `https://solana-gateway.moralis.io/token/mainnet/pairs/${pairAddress}/ohlcv?timeframe=1h&currency=usd&limit=24`,
          { headers }
        );
        if (ohlcvRes.ok) {
          const ohlcvData = await ohlcvRes.json();
          ohlcv = ohlcvData.result || [];
        }
      }
      return {
        name: meta.name,
        symbol: meta.symbol,
        price: Number(priceData.usdPrice) || 0,
        marketCap: Number(priceData.fullyDilutedValue) || 0,
        holders,
        volume: Number(priceData.total24hVolumeUsd) || 0,
        createdAt: meta.createdAt || null,
        ohlcv,
        swapVolumes: [],
        logs: [],
        pairAddress,
      };
    },
    enabled: !!tokenMint,
  });
}
