export async function fetchWithTimeout(
  url: string,
  //timeout is currently arbitrary, need to do research on p95
  timeoutMs = 10000,
): Promise<Response> {
  return fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
}
