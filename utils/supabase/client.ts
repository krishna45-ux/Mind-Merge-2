// @ts-nocheck
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = typeof process !== 'undefined' && process.env ? (process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL) : (import.meta.env?.VITE_SUPABASE_URL);
const supabaseKey = typeof process !== 'undefined' && process.env ? (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY) : (import.meta.env?.VITE_SUPABASE_ANON_KEY);

export const createClient = () =>
  createBrowserClient(
    supabaseUrl!,
    supabaseKey!,
  );
