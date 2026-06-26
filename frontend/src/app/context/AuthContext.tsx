import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { apiFetch, ApiError, clearStoredToken, getStoredToken, setStoredToken } from "../services/api";
import type { Relationship, SessionPayload, User } from "../lib/types";

interface AuthContextValue {
  isAuthenticated: boolean;
  ready: boolean;
  token: string | null;
  user: User | null;
  relationship: Relationship | null;
  error: string | null;
  login: (userId: number, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [token, setToken] = useState<string | null>(() => getStoredToken());
  const [user, setUser] = useState<User | null>(null);
  const [relationship, setRelationship] = useState<Relationship | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applySession = useCallback((payload: SessionPayload, nextToken?: string | null) => {
    setUser(payload.user);
    setRelationship(payload.relationship ?? null);
    if (typeof nextToken === "string") {
      setToken(nextToken);
      setStoredToken(nextToken);
    }
  }, []);

  const clearSession = useCallback(() => {
    clearStoredToken();
    setToken(null);
    setUser(null);
    setRelationship(null);
  }, []);

  const refreshSession = useCallback(async () => {
    const activeToken = getStoredToken();

    if (!activeToken) {
      clearSession();
      setReady(true);
      return;
    }

    try {
      const payload = await apiFetch<SessionPayload>("/auth/me", {
        token: activeToken,
      });

      applySession(payload, activeToken);
      setError(null);
    } catch (caught) {
      clearSession();

      if (!(caught instanceof ApiError) || caught.status !== 401) {
        setError(caught instanceof Error ? caught.message : "Unable to restore your session.");
      }
    } finally {
      setReady(true);
    }
  }, [applySession, clearSession]);

  useEffect(() => {
    void refreshSession();
  }, [refreshSession]);

  const login = useCallback(
    async (userId: number, password: string) => {
      const payload = await apiFetch<SessionPayload & { token: string }>("/auth/login", {
        method: "POST",
        body: {
          user_id: userId,
          password,
          device_name: "mobile-web",
        },
      });

      if (!payload.token || !payload.user) {
        throw new ApiError("Login succeeded, but the API did not return a complete session payload.", 500);
      }

      let sessionPayload: SessionPayload = payload;

      if (!payload.relationship) {
        const relationship = await apiFetch<Relationship>("/relationship", {
          token: payload.token,
        });

        sessionPayload = {
          ...payload,
          relationship,
        };
      }

      applySession(sessionPayload, payload.token);
      setError(null);
      setReady(true);
    },
    [applySession]
  );

  const logout = useCallback(async () => {
    const activeToken = getStoredToken();

    if (activeToken) {
      try {
        await apiFetch("/auth/logout", {
          method: "POST",
          token: activeToken,
        });
      } catch {
        // Ignore logout transport errors and clear the local session anyway.
      }
    }

    clearSession();
    setReady(true);
  }, [clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isAuthenticated: Boolean(token && user),
      ready,
      token,
      user,
      relationship,
      error,
      login,
      logout,
      refreshSession,
    }),
    [error, login, logout, ready, refreshSession, relationship, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}
