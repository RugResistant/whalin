// src/lib/moralis.ts
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6IjUxNzExNWIxLTMxNDUtNDc0Ni05YTQ2LWE2ZDFlZTU1MmVlYyIsIm9yZ0lkIjoiNDQ3NjYzIiwidXNlcklkIjoiNDYwNTg4IiwidHlwZUlkIjoiODFjOTJlMjYtNmEwNS00MDE3LThmZjYtYzUyNjhiNWM2OWFhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NDc1MjMzODMsImV4cCI6NDkwMzI4MzM4M30.2XeEp4emBvkscIMTyam6qiYORrfFYmBOrlJtIagmt9s';

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
