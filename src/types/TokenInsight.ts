// src/types/TokenInsight.ts
export interface TokenInsight {
  token_mint: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  holders: number;
  createdAt: string;
  volume: number;
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
    volume: number;
  }[];
  swapVolumes?: {
    time: string;
    volume: number;
  }[];
}
