export interface LoginAttemptRateLimiter {
    isLimited(identifier: string, now: Date): boolean;
    recordFailure(identifier: string, now: Date): void;
    recordSuccess(identifier: string): void;
}
export declare class InMemoryLoginAttemptRateLimiter implements LoginAttemptRateLimiter {
    private readonly windowMinutes;
    private readonly maxAttempts;
    private readonly attempts;
    constructor(windowMinutes: number, maxAttempts: number);
    isLimited(identifier: string, now: Date): boolean;
    recordFailure(identifier: string, now: Date): void;
    recordSuccess(identifier: string): void;
    private getActiveAttempts;
}
