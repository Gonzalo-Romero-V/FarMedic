/**
 * Wrapper mínimo de fetch para hablar con el backend Laravel.
 *
 * - Inyecta `Authorization: Bearer <token>` desde localStorage (single source of truth
 *   del token; las cookies del [[rbac]] son solo para enrutar en el edge middleware).
 * - Resuelve la URL contra `NEXT_PUBLIC_API_URL` (host sin `/api`), igual que
 *   `hooks/use-auth.tsx`.
 * - Lanza `ApiError` con status y payload cuando el backend responde non-2xx.
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? ""

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly payload?: unknown,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function readToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem("auth_token")
}

type ApiOptions = {
  signal?: AbortSignal
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  body?: unknown
}

export async function apiFetch<T>(path: string, opts: ApiOptions = {}): Promise<T> {
  const token = readToken()
  const url = `${API_BASE}/api${path.startsWith("/") ? path : `/${path}`}`

  // FormData se envía tal cual: el browser fija Content-Type con el boundary correcto.
  const isFormData = typeof FormData !== "undefined" && opts.body instanceof FormData

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(opts.body !== undefined && !isFormData ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    signal: opts.signal,
    body:
      opts.body === undefined
        ? undefined
        : isFormData
          ? (opts.body as FormData)
          : JSON.stringify(opts.body),
  })

  if (!res.ok) {
    let payload: unknown = undefined
    try {
      payload = await res.json()
    } catch {
      // sin body o no-JSON
    }
    throw new ApiError(res.status, `HTTP ${res.status} en ${path}`, payload)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
