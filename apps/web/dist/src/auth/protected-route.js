import { SessionExperienceController } from "./session-experience.js";
export class ProtectedRouteController {
    client;
    protectedPath;
    loginPath;
    state = { kind: "loading" };
    sessionExperience;
    constructor(client, protectedPath, loginPath) {
        this.client = client;
        this.protectedPath = protectedPath;
        this.loginPath = loginPath;
        this.sessionExperience = new SessionExperienceController(client, protectedPath, loginPath);
    }
    async bootstrap() {
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
    async logout() {
        this.state = await this.sessionExperience.logout();
        return this.state;
    }
    handleExpiredSession() {
        this.state = this.sessionExperience.buildExpiredSessionRedirect();
        return this.state;
    }
}
//# sourceMappingURL=protected-route.js.map