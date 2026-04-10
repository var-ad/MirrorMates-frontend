import { API_BASE_URL } from "@/lib/config";
import type {
  AdjectivesResponse,
  AuthResponse,
  BackendErrorPayload,
  CreateSessionInput,
  CreateSessionResponse,
  InviteMetaResponse,
  InviteSubmitResponse,
  LatestReportResponse,
  MeResponse,
  MessageResponse,
  ReportCreateResponse,
  ResultsResponse,
  SaveSelfSelectionsResponse,
  SessionDetailResponse,
  SessionSummary,
  SessionsResponse,
  SignupPendingResponse,
  TokenPair,
} from "@/lib/types";

export class ApiError extends Error {
  status: number;
  payload?: BackendErrorPayload;

  constructor(message: string, status: number, payload?: BackendErrorPayload) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type RequestInitWithJson = RequestInit & {
  json?: unknown;
  accessToken?: string;
};

async function request<T>(path: string, init: RequestInitWithJson = {}) {
  const headers = new Headers(init.headers);

  headers.set("Accept", "application/json");

  if (init.json !== undefined) {
    headers.set("Content-Type", "application/json");
  }

  if (init.accessToken) {
    headers.set("Authorization", `Bearer ${init.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    body: init.json !== undefined ? JSON.stringify(init.json) : init.body,
  });

  const contentType = response.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? ((await response.json()) as T | BackendErrorPayload)
    : undefined;

  if (!response.ok) {
    const errorPayload = payload as BackendErrorPayload | undefined;
    throw new ApiError(
      errorPayload?.message ?? response.statusText ?? "Request failed",
      response.status,
      errorPayload,
    );
  }

  return payload as T;
}

export function extractErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    return error.payload?.message ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Something went wrong";
}

export async function signup(input: {
  email: string;
  password: string;
  fullName?: string;
}) {
  return request<SignupPendingResponse>("/auth/signup", {
    method: "POST",
    json: input,
  });
}

export async function verifySignup(input: { email: string; otp: string }) {
  return request<AuthResponse>("/auth/signup/verify", {
    method: "POST",
    json: input,
  });
}

export async function login(input: { email: string; password: string }) {
  return request<AuthResponse>("/auth/login", {
    method: "POST",
    json: input,
  });
}

export async function googleLogin(input: { idToken: string }) {
  return request<AuthResponse>("/auth/google", {
    method: "POST",
    json: input,
  });
}

export async function forgotPassword(input: { email: string }) {
  return request<MessageResponse>("/auth/forgot-password", {
    method: "POST",
    json: input,
  });
}

export async function resetPassword(input: {
  email: string;
  otp: string;
  newPassword: string;
}) {
  return request<MessageResponse>("/auth/reset-password", {
    method: "POST",
    json: input,
  });
}

export async function refreshToken(refreshTokenValue: string) {
  return request<TokenPair>("/auth/refresh", {
    method: "POST",
    json: {
      refreshToken: refreshTokenValue,
    },
  });
}

export async function logout(refreshTokenValue: string) {
  return request<MessageResponse>("/auth/logout", {
    method: "POST",
    json: {
      refreshToken: refreshTokenValue,
    },
  });
}

export async function me(accessToken: string) {
  return request<MeResponse>("/auth/me", {
    method: "GET",
    accessToken,
  });
}

export async function changePassword(
  accessToken: string,
  input: { currentPassword: string; newPassword: string },
) {
  return request<AuthResponse>("/auth/password", {
    method: "PATCH",
    accessToken,
    json: input,
  });
}

export async function listAdjectives(accessToken: string) {
  return request<AdjectivesResponse>("/johari/adjectives", {
    method: "GET",
    accessToken,
  });
}

export async function listMySessions(accessToken: string) {
  return request<SessionsResponse>("/johari/sessions/me", {
    method: "GET",
    accessToken,
  });
}

export async function createSession(
  accessToken: string,
  input: CreateSessionInput,
) {
  return request<CreateSessionResponse>("/johari/session/create", {
    method: "POST",
    accessToken,
    json: input,
  });
}

export async function getSession(accessToken: string, sessionId: string) {
  return request<SessionDetailResponse>(`/johari/session/${sessionId}`, {
    method: "GET",
    accessToken,
  });
}

export async function saveSelfSelections(
  accessToken: string,
  sessionId: string,
  adjectiveIds: number[],
) {
  return request<SaveSelfSelectionsResponse>(
    `/johari/session/${sessionId}/self-select`,
    {
      method: "POST",
      accessToken,
      json: {
        adjectiveIds,
      },
    },
  );
}

export async function updateInviteSettings(
  accessToken: string,
  sessionId: string,
  input: Partial<CreateSessionInput>,
) {
  return request<{ session: SessionSummary }>(
    `/johari/session/${sessionId}/invite`,
    {
      method: "PATCH",
      accessToken,
      json: input,
    },
  );
}

export async function getInviteMeta(token: string) {
  return request<InviteMetaResponse>(
    `/invite/${encodeURIComponent(token)}/meta`,
    {
      method: "GET",
    },
  );
}

export async function submitInvite(
  token: string,
  input: { displayName?: string; adjectiveIds: number[] },
) {
  return request<InviteSubmitResponse>(
    `/invite/${encodeURIComponent(token)}/submit`,
    {
      method: "POST",
      json: input,
    },
  );
}

export async function getResults(accessToken: string, sessionId: string) {
  return request<ResultsResponse>(`/johari/session/${sessionId}/results`, {
    method: "GET",
    accessToken,
  });
}

export async function generateReport(
  accessToken: string,
  sessionId: string,
) {
  return request<ReportCreateResponse>(
    `/johari/session/${sessionId}/generate-report`,
    {
      method: "POST",
      accessToken,
    },
  );
}

export async function getLatestReport(
  accessToken: string,
  sessionId: string,
) {
  return request<LatestReportResponse>(`/johari/session/${sessionId}/report`, {
    method: "GET",
    accessToken,
  });
}
