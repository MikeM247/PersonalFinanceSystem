import type { AuthWebClient, LoginFormState } from "./types.js";
export interface LoginSubmissionSuccess {
    ok: true;
    redirectTo: string;
}
export interface LoginSubmissionFailure {
    ok: false;
    errorMessage: string;
}
export type LoginSubmissionResult = LoginSubmissionSuccess | LoginSubmissionFailure;
export declare class LoginPageController {
    private readonly client;
    private readonly redirectTo;
    readonly state: LoginFormState;
    constructor(client: AuthWebClient, redirectTo: string, initialState?: Partial<LoginFormState>);
    submit(email: string, password: string): Promise<LoginSubmissionResult>;
}
