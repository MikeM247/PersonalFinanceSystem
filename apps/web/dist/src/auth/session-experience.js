function buildLoginRedirect(loginPath, protectedPath) {
    const encodedPath = encodeURIComponent(protectedPath);
    return `${loginPath}?next=${encodedPath}`;
}
export class SessionExperienceController {
    client;
    protectedPath;
    loginPath;
    constructor(client, protectedPath, loginPath) {
        this.client = client;
        this.protectedPath = protectedPath;
        this.loginPath = loginPath;
    }
    async logout() {
        await this.client.logout();
        return {
            kind: "redirect",
            to: buildLoginRedirect(this.loginPath, this.protectedPath),
            reason: "logged_out",
            message: "You have been signed out.",
        };
    }
    buildExpiredSessionRedirect() {
        return {
            kind: "redirect",
            to: buildLoginRedirect(this.loginPath, this.protectedPath),
            reason: "expired",
            message: "Your session has expired. Please sign in again.",
        };
    }
    buildUnauthenticatedRedirect() {
        return {
            kind: "redirect",
            to: buildLoginRedirect(this.loginPath, this.protectedPath),
            reason: "unauthenticated",
            message: "Please sign in to continue.",
        };
    }
}
//# sourceMappingURL=session-experience.js.map