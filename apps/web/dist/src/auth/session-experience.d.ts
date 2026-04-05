import type { AuthWebClient, ProtectedRouteRedirectState } from "./types.js";
export declare class SessionExperienceController {
    private readonly client;
    private readonly protectedPath;
    private readonly loginPath;
    constructor(client: AuthWebClient, protectedPath: string, loginPath: string);
    logout(): Promise<ProtectedRouteRedirectState>;
    buildExpiredSessionRedirect(): ProtectedRouteRedirectState;
    buildUnauthenticatedRedirect(): ProtectedRouteRedirectState;
}
