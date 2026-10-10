import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSafeAuthRedirect } from "@/lib/auth/redirect";
import { isProjectAuthCookie, sessionCookieOptions } from "@/lib/auth/session-cookies";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
  const secure = request.nextUrl.protocol === "https:";
  const finish = (response: NextResponse) => {
    // Redirects must carry refreshed/deleted cookies as well as normal responses.
    if (response !== supabaseResponse) {
      for (const cookie of supabaseResponse.cookies.getAll()) response.cookies.set(cookie);
    }
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const isExplicitDevelopmentDemo =
    process.env.NODE_ENV !== "production" &&
    process.env.NEXT_PUBLIC_TCC_DEMO_MODE === "true";
  const isAccountRoute = request.nextUrl.pathname.startsWith("/account");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  const isProtectedRoute = isAccountRoute || isAdminRoute;

  // Protected routes fail closed. Mock auth is available only when explicitly
  // enabled in a development process.
  if (!supabaseUrl || !supabasePublishableKey || supabaseUrl === "https://your-project-ref.supabase.co") {
    if (isProtectedRoute && !isExplicitDevelopmentDemo) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.search = "";
      url.searchParams.set("next", request.nextUrl.pathname);
      url.searchParams.set("error", "service_unavailable");
      return finish(NextResponse.redirect(url));
    }
    return finish(supabaseResponse);
  }

  for (const { name, value } of request.cookies.getAll()) {
    if (isProjectAuthCookie(name, supabaseUrl)) supabaseResponse.cookies.set(name, value, sessionCookieOptions({}, secure, value));
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, responseHeaders) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        const previousCookies = supabaseResponse.cookies.getAll();
        supabaseResponse = NextResponse.next({
          request,
        });
        previousCookies.forEach(cookie => supabaseResponse.cookies.set(cookie));
        Object.entries(responseHeaders ?? {}).forEach(([name, value]) => supabaseResponse.headers.set(name, value));
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, sessionCookieOptions(options, secure, value))
        );
      },
    },
  });

  // Refresh auth token
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Refreshing the user above validates the cookie-backed session. Role lookup
  // is restricted to protected account/admin traffic, never public assets.
  if (isProtectedRoute && !isExplicitDevelopmentDemo) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/sign-in";
      url.search = "";
      url.searchParams.set("next", request.nextUrl.pathname);
      return finish(NextResponse.redirect(url));
    }

    const { data: staff, error: staffError } = await supabase
      .from("staff_accounts")
      .select("role, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (staffError) {
      console.error("Protected route authorization lookup failed", {
        code: staffError.code,
        pathname: request.nextUrl.pathname,
      });
      const url = request.nextUrl.clone();
      url.pathname = "/auth/access-denied";
      url.search = "";
      url.searchParams.set("reason", "service");
      return finish(NextResponse.redirect(url));
    }

    if (isAdminRoute && (!staff || staff.status !== "active")) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/access-denied";
      url.search = "";
      if (staff?.status === "inactive") url.searchParams.set("reason", "inactive");
      return finish(NextResponse.redirect(url));
    }

    if (isAccountRoute && staff) {
      const url = request.nextUrl.clone();
      url.pathname = staff.status === "active" ? "/admin" : "/auth/access-denied";
      url.search = "";
      if (staff.status === "inactive") url.searchParams.set("reason", "inactive");
      return finish(NextResponse.redirect(url));
    }
  }

  // Redirect authenticated users away from /auth/sign-in or /auth/create-account
  if (user && (request.nextUrl.pathname === "/auth/sign-in" || request.nextUrl.pathname === "/auth/create-account")) {
    const next = getSafeAuthRedirect(request.nextUrl.searchParams.get("next"));
    const url = request.nextUrl.clone();
    url.pathname = "/auth/continue";
    url.search = "";
    url.searchParams.set("next", next);
    return finish(NextResponse.redirect(url));
  }

  return finish(supabaseResponse);
}

export const config = {
  matcher: [
    "/account/:path*",
    "/admin/:path*",
    "/auth/:path*",
  ],
};
