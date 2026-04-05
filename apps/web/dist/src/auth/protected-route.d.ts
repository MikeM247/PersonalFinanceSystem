import type { AuthWebClient, ProtectedRouteState } from "./types.js";
export declare class ProtectedRouteController {
    private readonly client;
    private readonly protectedPath;
    private readonly loginPath;
    state: ProtectedRouteState;
    private readonly sessionExperience;
    constructor(client: AuthWebClient, protectedPath: string, loginPath: string);
    bootstrap(): Promise<ProtectedRouteState>;
    logout(): Promise<ProtectedRouteState>;
    handleExpiredSession(): ProtectedRouteState;
}
