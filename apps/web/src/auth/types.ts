export interface AuthenticatedUser {
  id: string;
  email: string;
  role: "owner";
}

export interface SessionSnapshot {
  expiresAt: string;
  idleExpiresAt: string;
}

export type LoginResult =
  | {
      ok: true;
      user: AuthenticatedUser;
      session: SessionSnapshot;
    }
  | {
      ok: false;
      error: string;
    };

export type SessionResult =
  | {
      authenticated: true;
      user: AuthenticatedUser;
      session: SessionSnapshot;
    }
  | {
      authenticated: false;
    };

export interface AuthWebClient {
  login(input: { email: string; password: string }): Promise<LoginResult>;
  getSession(): Promise<SessionResult>;
  logout(): Promise<{ loggedOut: boolean }>;
}

export interface LoginFormState {
  email: string;
  password: string;
  submitting: boolean;
  errorMessage: string | null;
}

export interface ProtectedRouteLoadingState {
  kind: "loading";
}

export interface ProtectedRouteReadyState {
  kind: "ready";
  user: AuthenticatedUser;
  session: SessionSnapshot;
}

export interface ProtectedRouteRedirectState {
  kind: "redirect";
  to: string;
  reason: "unauthenticated" | "expired" | "logged_out";
  message: string;
}

export type ProtectedRouteState =
  | ProtectedRouteLoadingState
  | ProtectedRouteReadyState
  | ProtectedRouteRedirectState;
