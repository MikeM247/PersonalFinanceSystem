export function createSessionCookie(token, configuration, expiresAt) {
    const maxAgeSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    return {
        name: configuration.cookieName,
        value: token,
        httpOnly: true,
        secure: configuration.cookieSecure,
        sameSite: configuration.cookieSameSite,
        path: "/",
        maxAgeSeconds,
    };
}
export function createClearedSessionCookie(configuration) {
    return {
        name: configuration.cookieName,
        value: "",
        httpOnly: true,
        secure: configuration.cookieSecure,
        sameSite: configuration.cookieSameSite,
        path: "/",
        maxAgeSeconds: 0,
    };
}
//# sourceMappingURL=cookies.js.map