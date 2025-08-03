// src/lib/utils.ts

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { supabase } from "./supabase";

// Tailwind utility to combine class names
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Enrich token mint from Supabase
export const enrichTokenMint = async (mint: string) => {
  const { data, error } = await supabase
    .from("ever_bought_tokens")
    .select("*")
    .eq("token_mint", mint)
    .maybeSingle();

  if (error) throw new Error("Failed to enrich token from Supabase");
  return data ?? {};
};
