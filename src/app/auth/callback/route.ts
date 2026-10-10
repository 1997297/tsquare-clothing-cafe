import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getSafeAuthRedirect } from "@/lib/auth/redirect";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const flowId = requestUrl.searchParams.get("sb_flow_id");
  const next = getSafeAuthRedirect(requestUrl.searchParams.get("next"));

  if (!code) {
    // Never log callback URLs, codes, tokens, verifier cookies or user details.
    console.warn("Auth callback rejected", { reason: "missing_code" });
    return NextResponse.redirect(new URL("/auth/forgot-password?error=invalid_or_expired", requestUrl.origin));
  }

  try {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code, flowId !== null ? { flowId } : undefined);
    if (error) {
      console.warn("Auth callback rejected", {
        reason: "exchange_failed",
        code: error.code && /^[a-z_]{1,80}$/.test(error.code) ? error.code : "unknown",
        status: error.status,
      });
      return NextResponse.redirect(new URL("/auth/forgot-password?error=invalid_or_expired", requestUrl.origin));
    }
    return NextResponse.redirect(new URL(next, requestUrl.origin));
  } catch {
    console.error("Auth callback failed", { reason: "service_unavailable" });
    return NextResponse.redirect(new URL("/auth/sign-in?error=service_unavailable", requestUrl.origin));
  }
}
