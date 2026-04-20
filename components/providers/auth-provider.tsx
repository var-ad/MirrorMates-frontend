"use client";

import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ApiError,
  changePassword as changePasswordRequest,
  extractErrorMessage,
  forgotPassword as forgotPasswordRequest,
  googleLogin as googleLoginRequest,
  login as loginRequest,
  logout as logoutRequest,
  me,
  refreshToken,
  resetPassword as resetPasswordRequest,
  signup as signupRequest,
  verifySignup as verifySignupRequest,
} from "@/lib/api";
import type { AuthResponse, AuthUser, SignupPendingResponse } from "@/lib/types";

interface StoredSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  isReady: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  accessToken: string | null;
  signup: (input: {
    email: string;
    password: string;
    fullName?: string;
  }) => Promise<SignupPendingResponse>;
  verifySignup: (input: { email: string; otp: string }) => Promise<AuthResponse>;
  login: (input: { email: string; password: string }) => Promise<AuthResponse>;
  googleLogin: (idToken: string) => Promise<AuthResponse>;
  forgotPassword: (email: string) => Promise<{ message: string }>;
  resetPassword: (input: {
    email: string;
    otp: string;
    newPassword: string;
  }) => Promise<{ message: string }>;
  changePassword: (input: {
    currentPassword: string;
    newPassword: string;
  }) => Promise<AuthResponse>;
  logout: () => Promise<void>;
  withAuthorized: <T>(operation: (accessToken: string) => Promise<T>) => Promise<T>;
  refreshProfile: () => Promise<void>;
}

const STORAGE_KEY = "mirrormates.session";
const AuthContext = createContext<AuthContextValue | null>(null);

function isStoredSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;
  const user = record.user;

  if (!user || typeof user !== "object") {
    return false;
  }

  const userRecord = user as Record<string, unknown>;

  return (
    typeof record.accessToken === "string" &&
    record.accessToken.length > 0 &&
    typeof record.refreshToken === "string" &&
    record.refreshToken.length > 0 &&
    typeof userRecord.id === "string" &&
    typeof userRecord.email === "string"
  );
}

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isStoredSession(parsed)) {
      window.localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function writeStoredSession(session: StoredSession | null) {
  if (typeof window === "undefined") {
    return;
  }

  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

function sessionFromAuthResponse(response: AuthResponse): StoredSession {
  return {
    user: response.user,
    accessToken: response.tokens.accessToken,
    refreshToken: response.tokens.refreshToken,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<StoredSession | null>(null);
  const [isReady, setIsReady] = useState(false);

  const applySession = useCallback((nextSession: StoredSession | null) => {
    writeStoredSession(nextSession);
    startTransition(() => {
      setSession(nextSession);
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const hydrateSession = async () => {
      const storedSession = readStoredSession();

      if (!storedSession) {
        if (!cancelled) {
          setIsReady(true);
        }
        return;
      }

      try {
        const currentUser = await me(storedSession.accessToken);

        if (!cancelled) {
          applySession({
            ...storedSession,
            user: currentUser.user,
          });
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          try {
            if (!cancelled) {
              const nextTokens = await refreshToken(storedSession.refreshToken);
              const nextUser = await me(nextTokens.accessToken);
              applySession({
                user: nextUser.user,
                accessToken: nextTokens.accessToken,
                refreshToken: nextTokens.refreshToken,
              });
            }
          } catch {
            if (!cancelled) {
              applySession(null);
            }
          }
        } else if (!cancelled) {
          applySession(null);
        }
      } finally {
        if (!cancelled) {
          setIsReady(true);
        }
      }
    };

    void hydrateSession();

  return () => {
      cancelled = true;
    };
  }, [applySession]);

  const withAuthorized = useCallback(
    async <T,>(operation: (accessToken: string) => Promise<T>): Promise<T> => {
      if (!session) {
        throw new Error("You need to sign in first");
      }

      try {
        return await operation(session.accessToken);
      } catch (error) {
        if (
          error instanceof ApiError &&
          error.status === 401 &&
          session.refreshToken
        ) {
          const nextTokens = await refreshToken(session.refreshToken);
          const nextUser = await me(nextTokens.accessToken);
          const refreshedSession: StoredSession = {
            user: nextUser.user,
            accessToken: nextTokens.accessToken,
            refreshToken: nextTokens.refreshToken,
          };
          applySession(refreshedSession);
          return operation(refreshedSession.accessToken);
        }

        throw error;
      }
    },
    [session, applySession],
  );

  const refreshProfile = useCallback(async () => {
    await withAuthorized(async (accessToken) => {
      const result = await me(accessToken);
      startTransition(() => {
        setSession((prev) => {
          if (!prev) {
            return null;
          }
          const next: StoredSession = { ...prev, user: result.user };
          writeStoredSession(next);
          return next;
        });
      });
      return result;
    });
  }, [withAuthorized]);

  const logout = useCallback(async () => {
    if (session?.refreshToken) {
      try {
        await logoutRequest(session.refreshToken);
      } catch (error) {
        console.warn(extractErrorMessage(error));
      }
    }

    applySession(null);
  }, [session?.refreshToken, applySession]);

  const changePassword = useCallback(
    async (input: { currentPassword: string; newPassword: string }) => {
      const response = await withAuthorized((accessToken) =>
        changePasswordRequest(accessToken, input),
      );
      applySession(sessionFromAuthResponse(response));
      return response;
    },
    [withAuthorized, applySession],
  );

  const value: AuthContextValue = useMemo(
    () => ({
      isReady,
      isAuthenticated: Boolean(session),
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      signup: async (input) => signupRequest(input),
      verifySignup: async (input) => {
        const response = await verifySignupRequest(input);
        applySession(sessionFromAuthResponse(response));
        return response;
      },
      login: async (input) => {
        const response = await loginRequest(input);
        applySession(sessionFromAuthResponse(response));
        return response;
      },
      googleLogin: async (idToken) => {
        const response = await googleLoginRequest({ idToken });
        applySession(sessionFromAuthResponse(response));
        return response;
      },
      forgotPassword: async (email) => forgotPasswordRequest({ email }),
      resetPassword: async (input) => resetPasswordRequest(input),
      changePassword,
      logout,
      withAuthorized,
      refreshProfile,
    }),
    [
      isReady,
      session,
      applySession,
      withAuthorized,
      refreshProfile,
      changePassword,
      logout,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
