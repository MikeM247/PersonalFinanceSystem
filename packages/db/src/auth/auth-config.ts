export type SameSiteSetting = "lax" | "strict" | "none";

export interface AuthRuntimeConfig {
  sessionSecret: string;
  cookieName: string;
  cookieSecure: boolean;
  cookieSameSite: SameSiteSetting;
  sessionIdleTimeoutMinutes: number;
  sessionAbsoluteTimeoutHours: number;
  loginWindowMinutes: number;
  loginMaxAttempts: number;
}

export interface OwnerProvisioningConfig extends AuthRuntimeConfig {
  databasePath: string;
  ownerEmail: string;
  ownerPassword: string;
  ownerId: string;
}

function readRequiredString(environment: NodeJS.ProcessEnv, key: string): string {
  const value = environment[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

function readBoolean(environment: NodeJS.ProcessEnv, key: string): boolean {
  const value = readRequiredString(environment, key).toLowerCase();
  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  throw new Error(`Environment variable ${key} must be "true" or "false".`);
}

function readPositiveInteger(environment: NodeJS.ProcessEnv, key: string): number {
  const value = Number(readRequiredString(environment, key));
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Environment variable ${key} must be a positive integer.`);
  }

  return value;
}

function readSameSite(environment: NodeJS.ProcessEnv, key: string): SameSiteSetting {
  const value = readRequiredString(environment, key).toLowerCase();
  if (value === "lax" || value === "strict" || value === "none") {
    return value;
  }

  throw new Error(`Environment variable ${key} must be one of: lax, strict, none.`);
}

export function loadAuthRuntimeConfig(environment: NodeJS.ProcessEnv): AuthRuntimeConfig {
  return {
    sessionSecret: readRequiredString(environment, "AUTH_SESSION_SECRET"),
    cookieName: readRequiredString(environment, "AUTH_COOKIE_NAME"),
    cookieSecure: readBoolean(environment, "AUTH_COOKIE_SECURE"),
    cookieSameSite: readSameSite(environment, "AUTH_COOKIE_SAME_SITE"),
    sessionIdleTimeoutMinutes: readPositiveInteger(environment, "AUTH_SESSION_IDLE_TIMEOUT_MINUTES"),
    sessionAbsoluteTimeoutHours: readPositiveInteger(environment, "AUTH_SESSION_ABSOLUTE_TIMEOUT_HOURS"),
    loginWindowMinutes: readPositiveInteger(environment, "AUTH_LOGIN_WINDOW_MINUTES"),
    loginMaxAttempts: readPositiveInteger(environment, "AUTH_LOGIN_MAX_ATTEMPTS"),
  };
}

export function loadOwnerProvisioningConfig(environment: NodeJS.ProcessEnv): OwnerProvisioningConfig {
  return {
    ...loadAuthRuntimeConfig(environment),
    databasePath: readRequiredString(environment, "AUTH_DATABASE_PATH"),
    ownerEmail: readRequiredString(environment, "AUTH_OWNER_EMAIL"),
    ownerPassword: readRequiredString(environment, "AUTH_OWNER_PASSWORD"),
    ownerId: environment.AUTH_OWNER_ID?.trim() || "owner-1",
  };
}
