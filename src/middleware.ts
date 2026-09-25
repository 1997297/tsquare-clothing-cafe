import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthRedirect } from "@/lib/auth/redirect";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isExplicitDevelopmentDemo =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_TCC_DEMO_MODE === "true";

  // Protected routes fail closed. Mock auth is available only when explicitly
  // enabled in a development process.
  if (!supabaseUrl || !supabasePublishableKey || supabaseUrl === "https://your-project-ref.supabase.co") {
    if (request.nextUrl.pathname.startsWith("/account") && !isExplicitDevelopmentDemo) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.search = "";
      url.searchParams.set("next", request.nextUrl.pathname);
      url.searchParams.set("error", "service_unavailable");
      return NextResponse.redirect(url);
    }
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protect /account routes
  if (request.nextUrl.pathname.startsWith("/account")) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }
  }

  // Redirect authenticated users away from /auth/sign-in or /auth/create-account
  if (user && (request.nextUrl.pathname === "/auth/sign-in" || request.nextUrl.pathname === "/auth/create-account")) {
    const next = getSafeAuthRedirect(request.nextUrl.searchParams.get("next"));
    const url = request.nextUrl.clone();
    url.pathname = next;
    url.search = "";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/account/:path*",
    "/auth/:path*",
  ],
};
