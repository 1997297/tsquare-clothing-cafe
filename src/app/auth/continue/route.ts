import { NextResponse } from "next/server";
import { getPostAuthDestination } from "@/lib/auth/roles";
import { getSafeAuthRedirect } from "@/lib/auth/redirect";
import { getAuthenticatedActor } from "@/lib/server/auth";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const requestedPath = getSafeAuthRedirect(requestUrl.searchParams.get("next"));

  try {
    const actor = await getAuthenticatedActor();
    if (!actor) {
      const signInUrl = new URL("/auth/sign-in", requestUrl.origin);
      signInUrl.searchParams.set("next", requestedPath);
      return NextResponse.redirect(signInUrl);
    }

    const destination = getPostAuthDestination(
      requestedPath,
      actor.role,
      actor.staffStatus
    );
    return NextResponse.redirect(new URL(destination, requestUrl.origin));
  } catch {
    return NextResponse.redirect(
      new URL("/auth/access-denied?reason=service", requestUrl.origin)
    );
  }
}
