// src/lib/moralis.ts
const API_KEY = import.meta.env.VITE_MORALIS_API_KEY!;

export async function enrichTokenMint(mint: string) {
  const url = `https://solana-gateway.moralis.io/token/mainnet/${mint}/metadata`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        accept: 'application/json',
        'X-API-Key': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`Moralis returned ${response.status}`);
    }

    const data = await response.json();

    return {
      name: data.name || 'Unknown',
      symbol: data.symbol || 'UNK',
      logo: data.logo || '',
      decimals: Number(data.decimals || 0),
      links: data.links || {},
      fullyDilutedValue: parseFloat(data.fullyDilutedValue || '0'),
    };
  } catch (e) {
    console.error(`Failed to enrich ${mint}:`, e);
    return {
      name: 'Unknown',
      symbol: 'UNK',
      logo: '',
      decimals: 0,
      links: {},
      fullyDilutedValue: 0,
    };
  }
}
