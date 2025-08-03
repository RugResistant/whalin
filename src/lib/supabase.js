// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://udlfxhvkbkzpvtjvtuyp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVkbGZ4aHZrYmt6cHZ0anZ0dXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mjc5ODAyNSwiZXhwIjoyMDY4Mzc0MDI1fQ.Luk5jg-pg1QuhsAT1iIe2HMazEVyh2onv7qDK7Ta9qw'; // Replace with your actual anon key
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
