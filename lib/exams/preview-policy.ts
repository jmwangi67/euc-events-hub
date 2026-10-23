type PreviewEnvironment = {
  NODE_ENV?: string;
  EUC_PRIVATE_EXAM_PREVIEW?: string;
};
type RequestHeaders = { get(name: string): string | null };
const loopback = new Set(["localhost", "127.0.0.1", "[::1]"]);
/** An explicit dev flag plus a loopback request; production/test never authorize reads. */
export function privateExamPreviewAllowed(
  env: PreviewEnvironment,
  headers: RequestHeaders,
) {
  if (env.NODE_ENV !== "development" || env.EUC_PRIVATE_EXAM_PREVIEW !== "1")
    return false;
  try {
    const host = headers.get("host");
    if (!host || !loopback.has(new URL(`http://${host}`).hostname))
      return false;
    const forwarded = headers.get("x-forwarded-for");
    if (
      forwarded &&
      forwarded
        .split(",")
        .some(
          (ip) => !["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(ip.trim()),
        )
    )
      return false;
    const origin = headers.get("origin");
    if (origin && !loopback.has(new URL(origin).hostname)) return false;
    const forwardedHost = headers.get("x-forwarded-host");
    return (
      !forwardedHost ||
      loopback.has(new URL(`http://${forwardedHost}`).hostname)
    );
  } catch {
    return false;
  }
}
