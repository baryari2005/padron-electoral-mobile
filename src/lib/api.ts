import { ENV } from './env';


export class ApiError extends Error {
  status: number;
  body?: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

export async function apiFetch<T>({
  path,
  init,
}: {
  path: string;
  init?: RequestInit;
}): Promise<T> {
  const base = ENV.API_BASE_URL;
  if (!base) throw new ApiError(500, "NEXT_PUBLIC_API_URL no configurada");

  const url = `${base}${path}`;
  const res = await fetch(url, {
    cache: "no-store",
    next: { revalidate: 0 },
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.headers || {}),
    },
  });

  let body: unknown = null;
  const text = await res.text().catch(() => "");
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }

  if (!res.ok) {
    // Propagá el status real
    throw new ApiError(res.status, typeof body === "string" ? body : (body as any)?.error || "Request failed", body);
  }
  return (body ?? {}) as T;
}
