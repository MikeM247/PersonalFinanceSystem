import type { AuthorizationContext } from "#core/src/index.js";

export interface ApiRequest<TBody = unknown> {
  body?: TBody;
  cookies?: Record<string, string | undefined>;
  requestId?: string;
  ipAddressHash?: string | null;
  userAgent?: string | null;
}

export interface ResponseCookie {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "lax" | "strict" | "none";
  path: string;
  maxAgeSeconds?: number;
}

export interface ApiResponse<TBody> {
  status: number;
  body: TBody;
  cookies?: ResponseCookie[];
}

export interface ProtectedRequest<TBody = unknown> extends ApiRequest<TBody> {
  auth: AuthorizationContext;
}
