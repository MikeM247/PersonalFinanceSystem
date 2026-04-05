import type { AuthWebClient, ProtectedRouteState } from "./types.js";
import { SessionExperienceController } from "./session-experience.js";

export class ProtectedRouteController {
  public state: ProtectedRouteState = { kind: "loading" };
  private readonly sessionExperience: SessionExperienceController;

  constructor(
    private readonly client: AuthWebClient,
    private readonly protectedPath: string,
    private readonly loginPath: string,
  ) {
    this.sessionExperience = new SessionExperienceController(client, protectedPath, loginPath);
  }

  async bootstrap(): Promise<ProtectedRouteState> {
    this.state = { kind: "loading" };
    const session = await this.client.getSession();

    if (!session.authenticated) {
      this.state = this.sessionExperience.buildUnauthenticatedRedirect();
      return this.state;
    }

    this.state = {
      kind: "ready",
      user: session.user,
      session: session.session,
    };
    return this.state;
  }

  async logout(): Promise<ProtectedRouteState> {
    this.state = await this.sessionExperience.logout();
    return this.state;
  }

  handleExpiredSession(): ProtectedRouteState {
    this.state = this.sessionExperience.buildExpiredSessionRedirect();
    return this.state;
  }
}
