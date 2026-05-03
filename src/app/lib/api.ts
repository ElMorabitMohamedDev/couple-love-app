const TOKEN_KEY = "couple-app-token";
const DEFAULT_API_URL = "http://127.0.0.1:8000/api";
const DEBUG_API = import.meta.env.DEV || import.meta.env.VITE_DEBUG_API === "true";
const API_TIMEOUT_MS = 20000;

export class ApiError extends Error {
  status: number;
  errors?: Record<string, string[]>;

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.errors = errors;
  }
}

interface ApiFetchOptions {
  method?: string;
  token?: string | null;
  body?: BodyInit | Record<string, unknown> | null;
  headers?: HeadersInit;
}

export const API_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, "") ?? DEFAULT_API_URL;

function debugLog(label: string, details: unknown) {
  if (DEBUG_API) {
    console.log(`[api] ${label}`, details);
  }
}

function debugError(label: string, details: unknown) {
  if (DEBUG_API) {
    console.error(`[api] ${label}`, details);
  }
}

function getValidationMessage(errors?: Record<string, string[]>) {
  const firstGroup = errors ? Object.values(errors)[0] : null;
  const firstMessage = firstGroup?.[0];

  return firstMessage ?? null;
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return getValidationMessage(error.errors) ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export function getStoredToken() {
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  window.localStorage.removeItem(TOKEN_KEY);
}

export async function apiFetch<T = unknown>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { body, headers, method = "GET", token } = options;
  const requestHeaders = new Headers(headers);
  const requestUrl = `${API_URL}${path}`;

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`);
  }

  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body != null) {
    requestHeaders.set("Content-Type", "application/json");
    payload = JSON.stringify(body);
  }

  requestHeaders.set("Accept", "application/json");

  debugLog("request", {
    method,
    url: requestUrl,
    hasToken: Boolean(token),
    body: body instanceof FormData ? "[FormData]" : body,
  });

  let response: Response;
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    response = await fetch(requestUrl, {
      method,
      headers: requestHeaders,
      body: payload,
      cache: "no-store",
      signal: controller.signal,
    });
  } catch (error) {
    debugError("network-error", {
      url: requestUrl,
      error,
    });

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError(
        `The request to ${requestUrl} took too long. Please check your connection and try again.`,
        0
      );
    }

    throw new ApiError(
      `Could not reach the API at ${API_URL}. Check VITE_API_URL and make sure Laravel is running.`,
      0
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  const text = await response.text();
  const contentType = response.headers.get("Content-Type") ?? "";
  let parsed: unknown = null;

  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch (error) {
      debugError("parse-error", {
        url: requestUrl,
        status: response.status,
        contentType,
        textPreview: text.slice(0, 240),
        error,
      });

      throw new ApiError(
        `The API at ${requestUrl} returned ${contentType || "a non-JSON response"} instead of JSON. Check VITE_API_URL.`,
        response.status
      );
    }
  }

  debugLog("response", {
    url: requestUrl,
    status: response.status,
    ok: response.ok,
    data: parsed,
  });

  if (!response.ok) {
    const parsedObject =
      parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : undefined;

    throw new ApiError(
      typeof parsedObject?.message === "string"
        ? parsedObject.message
        : `Request to ${requestUrl} failed with status ${response.status}.`,
      response.status,
      parsedObject?.errors as Record<string, string[]> | undefined
    );
  }

  if (parsed && typeof parsed === "object" && "data" in parsed) {
    return (parsed as { data: T }).data;
  }

  return parsed as T;
}
