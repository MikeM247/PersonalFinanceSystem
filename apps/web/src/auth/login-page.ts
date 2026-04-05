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

export class LoginPageController {
  public readonly state: LoginFormState;

  constructor(
    private readonly client: AuthWebClient,
    private readonly redirectTo: string,
    initialState?: Partial<LoginFormState>,
  ) {
    this.state = {
      email: initialState?.email ?? "",
      password: initialState?.password ?? "",
      submitting: false,
      errorMessage: null,
    };
  }

  async submit(email: string, password: string): Promise<LoginSubmissionResult> {
    this.state.email = email;
    this.state.password = password;
    this.state.submitting = true;
    this.state.errorMessage = null;

    const result = await this.client.login({ email, password });
    this.state.submitting = false;

    if (!result.ok) {
      this.state.errorMessage = "Invalid email or password.";
      return {
        ok: false,
        errorMessage: this.state.errorMessage,
      };
    }

    this.state.password = "";
    return {
      ok: true,
      redirectTo: this.redirectTo,
    };
  }
}
