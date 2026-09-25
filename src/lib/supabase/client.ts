import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabasePublishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabasePublishableKey &&
  supabaseUrl !== "https://your-project-ref.supabase.co"
);

export const isDemoMode =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_TCC_DEMO_MODE === "true";

export function createClient() {
  if (!isSupabaseConfigured) {
    // This placeholder is never used for data access unless explicit demo mode is
    // enabled. It keeps public, non-Supabase pages buildable without local secrets.
    return createBrowserClient(
      supabaseUrl || "https://demo.supabase.co",
      supabasePublishableKey || "demo-publishable-key"
    );
  }
  return createBrowserClient(supabaseUrl!, supabasePublishableKey!);
}

export const supabase = createClient();
