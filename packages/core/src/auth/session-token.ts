import { createHmac, randomBytes } from "node:crypto";

export function generateSessionToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashSessionToken(token: string, sessionSecret: string): Uint8Array {
  return createHmac("sha256", sessionSecret)
    .update(token, "utf8")
    .digest();
}
