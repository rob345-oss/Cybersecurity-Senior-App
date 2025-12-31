const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";
const API_KEY = import.meta.env.VITE_API_KEY ?? "";

function getAuthHeaders(includeContentType: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  // Add API key header if configured
  if (API_KEY) {
    headers["X-API-Key"] = API_KEY;
  }

  return headers;
}

export async function getJson<TResponse>(path: string): Promise<TResponse> {
  const headers = getAuthHeaders(false); // GET requests don't need Content-Type

  const response = await fetch(`${BASE_URL}/${path}`, {
    method: "GET",
    headers
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function postJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  const headers = getAuthHeaders(true); // POST requests need Content-Type

  const response = await fetch(`${BASE_URL}/${path}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }

  return (await response.json()) as TResponse;
}
