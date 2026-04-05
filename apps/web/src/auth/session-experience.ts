import type { AuthWebClient, ProtectedRouteRedirectState } from "./types.js";

function buildLoginRedirect(loginPath: string, protectedPath: string): string {
  const encodedPath = encodeURIComponent(protectedPath);
  return `${loginPath}?next=${encodedPath}`;
}

export class SessionExperienceController {
  constructor(
    private readonly client: AuthWebClient,
    private readonly protectedPath: string,
    private readonly loginPath: string,
  ) {}

  async logout(): Promise<ProtectedRouteRedirectState> {
    await this.client.logout();
    return {
      kind: "redirect",
      to: buildLoginRedirect(this.loginPath, this.protectedPath),
      reason: "logged_out",
      message: "You have been signed out.",
    };
  }

  buildExpiredSessionRedirect(): ProtectedRouteRedirectState {
    return {
      kind: "redirect",
      to: buildLoginRedirect(this.loginPath, this.protectedPath),
      reason: "expired",
      message: "Your session has expired. Please sign in again.",
    };
  }

  buildUnauthenticatedRedirect(): ProtectedRouteRedirectState {
    return {
      kind: "redirect",
      to: buildLoginRedirect(this.loginPath, this.protectedPath),
      reason: "unauthenticated",
      message: "Please sign in to continue.",
    };
  }
}
