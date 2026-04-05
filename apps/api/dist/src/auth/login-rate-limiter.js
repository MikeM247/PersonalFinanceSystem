export class InMemoryLoginAttemptRateLimiter {
    windowMinutes;
    maxAttempts;
    attempts = new Map();
    constructor(windowMinutes, maxAttempts) {
        this.windowMinutes = windowMinutes;
        this.maxAttempts = maxAttempts;
    }
    isLimited(identifier, now) {
        const activeAttempts = this.getActiveAttempts(identifier, now);
        return activeAttempts.length >= this.maxAttempts;
    }
    recordFailure(identifier, now) {
        const activeAttempts = this.getActiveAttempts(identifier, now);
        activeAttempts.push(now.getTime());
        this.attempts.set(identifier, activeAttempts);
    }
    recordSuccess(identifier) {
        this.attempts.delete(identifier);
    }
    getActiveAttempts(identifier, now) {
        const cutoff = now.getTime() - this.windowMinutes * 60 * 1000;
        const attempts = this.attempts.get(identifier) ?? [];
        const activeAttempts = attempts.filter((attempt) => attempt > cutoff);
        this.attempts.set(identifier, activeAttempts);
        return activeAttempts;
    }
}
//# sourceMappingURL=login-rate-limiter.js.map