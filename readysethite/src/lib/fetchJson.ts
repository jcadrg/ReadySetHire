/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Minimal API helper for ReadySetHire.
 */

export type HttpMethod = "GET" | "POST" | "PATCH" | "DELETE";

export interface FetchJsonOptions extends RequestInit {
  timeoutMs?: number;
  noJsonContentType?: boolean;
}

function getBase() {
  const base = import.meta.env.VITE_API_BASE as string | undefined;
  if (!base) throw new Error("VITE_API_BASE is not set");
  return base.replace(/\/$/, "");
}

function getJwt() {
  const jwt = import.meta.env.VITE_API_JWT as string | undefined;
  if (!jwt) throw new Error("VITE_API_JWT is not set");
  return jwt;
}

/** Accepts AbortSignal | null | undefined */
function withTimeout(signal: AbortSignal | null | undefined, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const cleanup = () => clearTimeout(timeout);

  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener("abort", () => controller.abort(), { once: true });
  }

  return { signal: controller.signal, cleanup };
}

function joinPath(base: string, path: string) {
  if (!path.startsWith("/")) return base + "/" + path;
  return base + path;
}

async function coreFetch<T>(path: string, init: FetchJsonOptions = {}): Promise<T> {
  const base = getBase();
  const jwt = getJwt();

  const { timeoutMs = 15000, noJsonContentType = false, headers, ...rest } = init;

  const authHeaders: Record<string, string> = {
    Authorization: `Bearer ${jwt}`,
  };

  const jsonHeaders: Record<string, string> = noJsonContentType
    ? {}
    : { "Content-Type": "application/json" };

  const mergedHeaders: HeadersInit = {
    ...jsonHeaders,
    ...authHeaders,
    ...(headers || {}),
  };

  const { signal, cleanup } = withTimeout(init.signal ?? undefined, timeoutMs);

  try {
    const res = await fetch(joinPath(base, path), { ...rest, headers: mergedHeaders, signal });

    if (!res.ok) {
      let body: any = null;
      try {
        const text = await res.text();
        body = text ? JSON.parse(text) : null;
      } catch {
        // ignore parse errors
      }
      const message =
        (body && (body.message || body.error || JSON.stringify(body))) ||
        `HTTP ${res.status} ${res.statusText}`;
      const err = new Error(message) as Error & { status?: number; body?: unknown };
      err.status = res.status;
      err.body = body;
      throw err;
    }

    if (res.status === 204) {
      return undefined as unknown as T;
    }

    const contentType = res.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return (await res.json()) as T;
    }
    return (await res.text()) as unknown as T;
  } finally {
    cleanup();
  }
}

async function get<T>(path: string, init?: Omit<FetchJsonOptions, "method" | "body">) {
  return coreFetch<T>(path, { ...init, method: "GET" });
}

async function del<T>(path: string, init?: Omit<FetchJsonOptions, "method" | "body">) {
  return coreFetch<T>(path, { ...init, method: "DELETE" });
}

async function post<T>(path: string, body?: unknown, init?: Omit<FetchJsonOptions, "method" | "body">) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  return coreFetch<T>(path, {
    ...init,
    method: "POST",
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    noJsonContentType: isFormData || init?.noJsonContentType,
  });
}

async function patch<T>(path: string, body?: unknown, init?: Omit<FetchJsonOptions, "method" | "body">) {
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
  return coreFetch<T>(path, {
    ...init,
    method: "PATCH",
    body: isFormData ? (body as FormData) : body ? JSON.stringify(body) : undefined,
    noJsonContentType: isFormData || init?.noJsonContentType,
  });
}

export const api = { get, post, patch, del, coreFetch };
export default api;
