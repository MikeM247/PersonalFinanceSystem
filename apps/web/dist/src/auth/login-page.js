export class LoginPageController {
    client;
    redirectTo;
    state;
    constructor(client, redirectTo, initialState) {
        this.client = client;
        this.redirectTo = redirectTo;
        this.state = {
            email: initialState?.email ?? "",
            password: initialState?.password ?? "",
            submitting: false,
            errorMessage: null,
        };
    }
    async submit(email, password) {
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
//# sourceMappingURL=login-page.js.map