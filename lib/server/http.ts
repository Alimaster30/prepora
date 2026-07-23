export class RequestTimeoutError extends Error {
  constructor(message = "The upstream service did not respond in time.") {
    super(message);
    this.name = "RequestTimeoutError";
  }
}

export async function fetchWithTimeout(
  input: string | URL | Request,
  init: RequestInit = {},
  timeoutMs = 10_000
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const forwardAbort = () => controller.abort();
  init.signal?.addEventListener("abort", forwardAbort, { once: true });

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } catch (error: unknown) {
    if (controller.signal.aborted && !init.signal?.aborted) {
      throw new RequestTimeoutError();
    }
    throw error;
  } finally {
    clearTimeout(timeout);
    init.signal?.removeEventListener("abort", forwardAbort);
  }
}
