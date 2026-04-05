import type { AuthRuntimeConfig } from "#core/src/index.js";

import type { ResponseCookie } from "./http-types.js";

export function createSessionCookie(
  token: string,
  configuration: AuthRuntimeConfig,
  expiresAt: Date,
): ResponseCookie {
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

export function createClearedSessionCookie(configuration: AuthRuntimeConfig): ResponseCookie {
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
