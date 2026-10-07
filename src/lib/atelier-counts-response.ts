/** Keep authentication failures distinct from service outages without exposing details. */
export async function atelierCountsResponse(loadCounts: () => Promise<unknown>): Promise<Response> {
  const headers = { "Cache-Control": "private, no-store" };
  try {
    return Response.json(await loadCounts(), { headers });
  } catch (error) {
    if (error instanceof Error && error.message === "AUTH_REQUIRED") {
      return Response.json({ error: "Authentication required" }, { status: 401, headers });
    }
    if (error instanceof Error && error.message === "STAFF_ACCESS_DENIED") {
      return Response.json({ error: "Access denied" }, { status: 403, headers });
    }
    return Response.json({ error: "Atelier counts unavailable" }, { status: 503, headers });
  }
}
