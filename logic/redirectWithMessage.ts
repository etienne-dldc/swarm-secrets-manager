export function redirectWithMessage(
  path: string,
  type: "ok" | "error",
  message: string,
): Response {
  const searchParams = new URLSearchParams();
  searchParams.set(type, message);

  return new Response(null, {
    status: 303,
    headers: {
      location: `${path}?${searchParams.toString()}`,
      "cache-control": "no-store",
    },
  });
}
