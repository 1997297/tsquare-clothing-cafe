import { createBrowserClient, parseCookieHeader, serializeCookieHeader } from "@supabase/ssr";
import { isProjectAuthCookie, sessionCookieOptions } from "@/lib/auth/session-cookies";

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
  !isSupabaseConfigured &&
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
  if (typeof document !== "undefined") {
    // Migrate this project's older persistent cookies without resetting the session.
    for (const { name, value } of parseCookieHeader(document.cookie)) {
      if (isProjectAuthCookie(name, supabaseUrl!)) document.cookie = serializeCookieHeader(name, value,
        sessionCookieOptions({}, location.protocol === "https:", value));
    }
  }
  return createBrowserClient(supabaseUrl!, supabasePublishableKey!, {
    cookies: {
      getAll: () => typeof document === "undefined" ? [] : parseCookieHeader(document.cookie),
      setAll(cookies) {
        if (typeof document === "undefined") return;
        for (const { name, value, options } of cookies) document.cookie = serializeCookieHeader(name, value,
          sessionCookieOptions(options, location.protocol === "https:", value));
      },
    },
  });
}

export const supabase = createClient();
