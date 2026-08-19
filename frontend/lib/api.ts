const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiFetch<T>(
  path: string,
  { params, ...init }: FetchOptions = {}
): Promise<T> {
  const url = new URL(`${API_URL}${path}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });
  }

  const response = await fetch(url.toString(), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...init.headers,
    },
  });

  if (!response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      body = null;
    }
    throw new ApiError(
      response.status,
      `API error ${response.status}: ${response.statusText}`,
      body
    );
  }

  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Typed API helpers (expanded in Phase 2)
// ---------------------------------------------------------------------------

export interface HealthResponse {
  status: string;
  db: string;
}

export const api = {
  health: () => apiFetch<HealthResponse>("/api/health"),
} as const;

export { apiFetch, ApiError };
