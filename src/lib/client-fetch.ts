// src/lib/client-fetch.ts
export async function clientFetchItems<T>(path: string, init?: RequestInit): Promise<T[]> {
  const res = await fetch(path, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    ...init,
  });
  const ct = res.headers.get("content-type") || "";
  let body: unknown = null;
  if (ct.includes("application/json")) {
    body = await res.json().catch(() => null);
  } else {
    const text = await res.text().catch(() => "");
    try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  }
  if (!res.ok) {
    const msg = typeof body === "string" ? body : (body as any)?.error || (body as any)?.message || `Error ${res.status}`;
    throw new Error(msg);
  }
  if (Array.isArray(body)) return body as T[];
  if (body && typeof body === "object" && "items" in (body as any)) {
    return ((body as any).items ?? []) as T[];
  }
  return [];
}
