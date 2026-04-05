export interface LoginAttemptRateLimiter {
  isLimited(identifier: string, now: Date): boolean;
  recordFailure(identifier: string, now: Date): void;
  recordSuccess(identifier: string): void;
}

export class InMemoryLoginAttemptRateLimiter implements LoginAttemptRateLimiter {
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly windowMinutes: number,
    private readonly maxAttempts: number,
  ) {}

  isLimited(identifier: string, now: Date): boolean {
    const activeAttempts = this.getActiveAttempts(identifier, now);
    return activeAttempts.length >= this.maxAttempts;
  }

  recordFailure(identifier: string, now: Date): void {
    const activeAttempts = this.getActiveAttempts(identifier, now);
    activeAttempts.push(now.getTime());
    this.attempts.set(identifier, activeAttempts);
  }

  recordSuccess(identifier: string): void {
    this.attempts.delete(identifier);
  }

  private getActiveAttempts(identifier: string, now: Date): number[] {
    const cutoff = now.getTime() - this.windowMinutes * 60 * 1000;
    const attempts = this.attempts.get(identifier) ?? [];
    const activeAttempts = attempts.filter((attempt) => attempt > cutoff);
    this.attempts.set(identifier, activeAttempts);
    return activeAttempts;
  }
}
