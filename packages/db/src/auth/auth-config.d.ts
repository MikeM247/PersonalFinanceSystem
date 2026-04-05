export type SameSiteSetting = "lax" | "strict" | "none";
export interface AuthRuntimeConfig {
    sessionSecret: string;
    cookieName: string;
    cookieSecure: boolean;
    cookieSameSite: SameSiteSetting;
    sessionIdleTimeoutMinutes: number;
    sessionAbsoluteTimeoutHours: number;
}
export interface OwnerProvisioningConfig extends AuthRuntimeConfig {
    databasePath: string;
    ownerEmail: string;
    ownerPassword: string;
    ownerId: string;
}
export declare function loadAuthRuntimeConfig(environment: NodeJS.ProcessEnv): AuthRuntimeConfig;
export declare function loadOwnerProvisioningConfig(environment: NodeJS.ProcessEnv): OwnerProvisioningConfig;
