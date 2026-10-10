import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { sessionCookieOptions } from "@/lib/auth/session-cookies";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();
  const secure = (await headers()).get("x-forwarded-proto") === "https";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabasePublishableKey || supabaseUrl === "https://your-project-ref.supabase.co") {
    throw new Error("SUPABASE_NOT_CONFIGURED");
  }

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, sessionCookieOptions(options, secure, value))
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing user sessions.
        }
      },
    },
  });
}
