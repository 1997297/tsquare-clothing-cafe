import type { CookieOptions } from "@supabase/ssr";

/** Keep PKCE/refresh cookies shared across tabs, but do not persist past a browser session.
 * Session restore is browser-controlled; this is not a server-side session timeout.
 * Normalize at setAll: the installed SSR SDK overrides cookieOptions.maxAge itself.
 */
export function sessionCookieOptions(options: CookieOptions, secure: boolean, value: string): CookieOptions {
  const result = { ...options, path: options.path ?? "/", sameSite: options.sameSite ?? "lax", secure };
  if (value === "" || (options.maxAge !== undefined && options.maxAge <= 0)) {
    return { ...result, maxAge: 0, expires: new Date(0) };
  }
  delete result.maxAge;
  delete result.expires;
  return result;
}

export function isProjectAuthCookie(name: string, projectUrl: string) {
  const key = `sb-${new URL(projectUrl).hostname.split('.')[0]}-auth-token`;
  const base = name.replace(/\.(0|[1-9]\d*)$/, "");
  return [key, `${key}-code-verifier`, `${key}-flows-code-verifier`, `${key}-user`].includes(base) ||
    (base.startsWith(`${key}-flow-`) && /^[A-Za-z0-9_-]{8,64}-code-verifier$/.test(base.slice(key.length + 6)));
}
