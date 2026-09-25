import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSafeAuthRedirect } from "@/lib/auth/redirect";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = getSafeAuthRedirect(requestUrl.searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(new URL("/auth/forgot-password?error=invalid_or_expired", requestUrl.origin));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL("/auth/forgot-password?error=invalid_or_expired", requestUrl.origin));
    }
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch {
    return NextResponse.redirect(new URL("/auth/sign-in?error=service_unavailable", requestUrl.origin));
  }
}
