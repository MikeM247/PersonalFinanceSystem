function readRequiredString(environment, key) {
    const value = environment[key]?.trim();
    if (!value) {
        throw new Error(`Missing required environment variable: ${key}`);
    }
    return value;
}
function readBoolean(environment, key) {
    const value = readRequiredString(environment, key).toLowerCase();
    if (value === "true") {
        return true;
    }
    if (value === "false") {
        return false;
    }
    throw new Error(`Environment variable ${key} must be "true" or "false".`);
}
function readPositiveInteger(environment, key) {
    const value = Number(readRequiredString(environment, key));
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`Environment variable ${key} must be a positive integer.`);
    }
    return value;
}
function readSameSite(environment, key) {
    const value = readRequiredString(environment, key).toLowerCase();
    if (value === "lax" || value === "strict" || value === "none") {
        return value;
    }
    throw new Error(`Environment variable ${key} must be one of: lax, strict, none.`);
}
export function loadAuthRuntimeConfig(environment) {
    return {
        sessionSecret: readRequiredString(environment, "AUTH_SESSION_SECRET"),
        cookieName: readRequiredString(environment, "AUTH_COOKIE_NAME"),
        cookieSecure: readBoolean(environment, "AUTH_COOKIE_SECURE"),
        cookieSameSite: readSameSite(environment, "AUTH_COOKIE_SAME_SITE"),
        sessionIdleTimeoutMinutes: readPositiveInteger(environment, "AUTH_SESSION_IDLE_TIMEOUT_MINUTES"),
        sessionAbsoluteTimeoutHours: readPositiveInteger(environment, "AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS"),
    };
}
export function loadOwnerProvisioningConfig(environment) {
    return {
        ...loadAuthRuntimeConfig(environment),
        databasePath: readRequiredString(environment, "AUTH_DATABASE_PATH"),
        ownerEmail: readRequiredString(environment, "AUTH_OWNER_EMAIL"),
        ownerPassword: readRequiredString(environment, "AUTH_OWNER_PASSWORD"),
        ownerId: environment.AUTH_OWNER_ID?.trim() || "owner-1",
    };
}
//# sourceMappingURL=auth-config.js.map