import type { AuthRuntimeConfig } from "#core/src/index.js";
import type { ResponseCookie } from "./http-types.js";
export declare function createSessionCookie(token: string, configuration: AuthRuntimeConfig, expiresAt: Date): ResponseCookie;
export declare function createClearedSessionCookie(configuration: AuthRuntimeConfig): ResponseCookie;
