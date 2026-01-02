import { apiCache } from "./utils/cache";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// Log the API URL being used (helpful for debugging)
if (import.meta.env.DEV) {
  console.log(`[API] Using backend URL: ${BASE_URL}`);
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:3',message:'BASE_URL initialized',data:{baseUrl:BASE_URL,envUrl:import.meta.env.VITE_API_URL,isDev:import.meta.env.DEV},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  // #endregion
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

// Cache configuration
const CACHE_ENABLED = true;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes default TTL

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public originalError?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function getAuthHeaders(includeContentType: boolean = true): Record<string, string> {
  const headers: Record<string, string> = {};

  if (includeContentType) {
    headers["Content-Type"] = "application/json";
  }

  // Add JWT token from session storage
  const accessToken = sessionStorage.getItem("access_token");
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:38',message:'Auth headers check',data:{hasToken:!!accessToken,tokenLength:accessToken?.length||0,includeContentType},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  // #endregion
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  return headers;
}

/**
 * Extracts a user-friendly error message from the response
 */
async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const errorData = await response.json();
      // Try to extract error message from common error response formats
      if (errorData.detail) {
        return errorData.detail;
      }
      if (errorData.message) {
        return errorData.message;
      }
      if (errorData.error) {
        return typeof errorData.error === "string" ? errorData.error : JSON.stringify(errorData.error);
      }
    }
  } catch {
    // If parsing fails, fall back to status text
  }

  // Generate user-friendly messages based on status code
  switch (response.status) {
    case 400:
      return "Invalid request. Please check your input and try again.";
    case 401:
      return "Authentication failed. Please log in again.";
    case 403:
      return "You don't have permission to perform this action.";
    case 404:
      return "The requested resource was not found.";
    case 429:
      return "Too many requests. Please wait a moment and try again.";
    case 500:
      return "Server error. Please try again later.";
    case 502:
    case 503:
      return "Service temporarily unavailable. Please try again in a moment.";
    case 504:
      return "Request timed out. Please try again.";
    default:
      return `Request failed with status ${response.status}. Please try again.`;
  }
}

/**
 * Sleep utility for retry delays
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Makes a fetch request with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:110',message:'Fetch attempt start',data:{url,attempt,method:options.method||'GET',hasSignal:!!options.signal},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // Create abort controller for timeout (if not already provided)
      let signal: AbortSignal | undefined = undefined;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      
      if (!options.signal) {
        const controller = new AbortController();
        signal = controller.signal;
        timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:120',message:'About to call fetch',data:{url,fullUrl:url,headers:Object.keys(options.headers||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const response = await fetch(url, {
        ...options,
        signal: signal || options.signal,
      });
      
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:130',message:'Fetch response received',data:{url,status:response.status,statusText:response.statusText,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (!response.ok && response.status >= 400 && response.status < 500 && response.status !== 429) {
        return response; // Return immediately for client errors
      }

      // Retry on server errors (5xx) and rate limits (429)
      if (response.ok || (response.status >= 500 || response.status === 429)) {
        if (response.ok) {
          return response;
        }
        // If this is the last attempt, return the error response
        if (attempt === retries) {
          return response;
        }
        // Calculate exponential backoff delay
        const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }

      return response;
    } catch (error) {
      lastError = error;
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:135',message:'Fetch error caught',data:{url,attempt,errorType:error?.constructor?.name,errorName:(error as Error)?.name,errorMessage:(error as Error)?.message,errorStack:(error as Error)?.stack?.substring(0,200),isLastAttempt:attempt===retries},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      // If this is the last attempt, throw the error
      if (attempt === retries) {
        // Enhance error message for connection failures
        if (error instanceof Error && (error.name === 'AbortError' || error.message.includes('aborted'))) {
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:142',message:'Timeout error detected',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
          // #endregion
          throw new Error(`Connection timeout: Unable to reach ${url}. The backend server may not be running.`);
        }
        throw error;
      }
      // Calculate exponential backoff delay for network errors
      const delay = INITIAL_RETRY_DELAY * Math.pow(2, attempt);
      await sleep(delay);
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error("Request failed after retries");
}

export async function getJson<TResponse>(
  path: string,
  options?: { useCache?: boolean; cacheTTL?: number }
): Promise<TResponse> {
  const useCache = options?.useCache ?? CACHE_ENABLED;
  const cacheTTL = options?.cacheTTL ?? CACHE_TTL;

  // Check cache first
  if (useCache) {
    const cached = apiCache.get<TResponse>(path);
    if (cached !== null) {
      return cached;
    }
  }

  const headers = getAuthHeaders(false); // GET requests don't need Content-Type

  try {
    const response = await fetchWithRetry(`${BASE_URL}/${path}`, {
      method: "GET",
      headers
    });

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response);
      throw new ApiError(errorMessage, response.status);
    }

    const data = (await response.json()) as TResponse;

    // Cache the response
    if (useCache) {
      apiCache.set(path, data, undefined, cacheTTL);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors and other exceptions
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        `Unable to connect to the server at ${BASE_URL}. Please ensure the backend is running on port 8000.`,
        undefined,
        error
      );
    }
    // Handle other network errors (like connection refused)
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes("failed to fetch") || errorMsg.includes("network") || errorMsg.includes("connection")) {
        throw new ApiError(
          `Cannot connect to backend API at ${BASE_URL}. Please ensure the backend server is running. Start it with: python -m uvicorn backend.main:app --reload`,
          undefined,
          error
        );
      }
    }
    throw new ApiError(
      `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}. Please check that the backend is running at ${BASE_URL}.`,
      undefined,
      error
    );
  }
}

export async function postJson<TResponse>(
  path: string,
  body: unknown,
  options?: { useCache?: boolean; cacheTTL?: number }
): Promise<TResponse> {
  const useCache = options?.useCache ?? CACHE_ENABLED;
  const cacheTTL = options?.cacheTTL ?? CACHE_TTL;

  // Check cache first (for idempotent POST requests)
  if (useCache) {
    const cached = apiCache.get<TResponse>(path, body);
    if (cached !== null) {
      return cached;
    }
  }

  const headers = getAuthHeaders(true); // POST requests need Content-Type

  try {
    const fullUrl = `${BASE_URL}/${path}`;
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/43eae5cd-d1bf-470d-b257-f562a708e1f3',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'api.ts:220',message:'postJson called',data:{path,fullUrl,baseUrl:BASE_URL,bodyKeys:Object.keys(body as Record<string,unknown>||{})},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    const response = await fetchWithRetry(fullUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorMessage = await extractErrorMessage(response);
      throw new ApiError(errorMessage, response.status);
    }

    const data = (await response.json()) as TResponse;

    // Cache the response (only cache successful responses)
    if (useCache) {
      apiCache.set(path, data, body, cacheTTL);
    }

    return data;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle network errors and other exceptions
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new ApiError(
        `Unable to connect to the server at ${BASE_URL}. Please ensure the backend is running on port 8000.`,
        undefined,
        error
      );
    }
    // Handle other network errors (like connection refused)
    if (error instanceof Error) {
      const errorMsg = error.message.toLowerCase();
      if (errorMsg.includes("failed to fetch") || errorMsg.includes("network") || errorMsg.includes("connection")) {
        throw new ApiError(
          `Cannot connect to backend API at ${BASE_URL}. Please ensure the backend server is running. Start it with: python -m uvicorn backend.main:app --reload`,
          undefined,
          error
        );
      }
    }
    throw new ApiError(
      `An unexpected error occurred: ${error instanceof Error ? error.message : String(error)}. Please check that the backend is running at ${BASE_URL}.`,
      undefined,
      error
    );
  }
}
