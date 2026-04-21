function normalizeApiBaseUrl(rawValue: string): string {
  const value = rawValue.trim().replace(/\/+$/, "");

  if (!value) {
    return "http://localhost:4000";
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Handle hosts provided without protocol (common in hosted env vars).
  if (/^(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(value)) {
    return `http://${value}`;
  }

  return `https://${value}`;
}

export const API_BASE_URL = normalizeApiBaseUrl(
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000",
);

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";
