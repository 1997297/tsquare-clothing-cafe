import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== "https://your-project-ref.supabase.co"
);

export function createClient() {
  if (!isSupabaseConfigured) {
    // Return mock-compatible client or fallback
    return createBrowserClient(
      supabaseUrl || "https://demo.supabase.co",
      supabaseAnonKey || "demo-anon-key"
    );
  }
  return createBrowserClient(supabaseUrl!, supabaseAnonKey!);
}

export const supabase = createClient();
