interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 60,
  windowMs: 60000,
};

const inMemoryStore = new Map<string, RateLimitEntry>();

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of inMemoryStore.entries()) {
      if (entry.resetAt <= now) {
        inMemoryStore.delete(key);
      }
    }
  }

  isRateLimited(identifier: string): { limited: boolean; retryAfterMs?: number } {
    this.cleanup();

    const now = Date.now();
    const entry = inMemoryStore.get(identifier);

    if (!entry || entry.resetAt <= now) {
      inMemoryStore.set(identifier, {
        count: 1,
        resetAt: now + this.config.windowMs,
      });
      return { limited: false };
    }

    if (entry.count >= this.config.maxRequests) {
      return {
        limited: true,
        retryAfterMs: entry.resetAt - now,
      };
    }

    entry.count++;
    return { limited: false };
  }

  getRemainingRequests(identifier: string): number {
    this.cleanup();

    const entry = inMemoryStore.get(identifier);
    if (!entry) return this.config.maxRequests;

    const now = Date.now();
    if (entry.resetAt <= now) return this.config.maxRequests;

    return Math.max(0, this.config.maxRequests - entry.count);
  }

  reset(identifier?: string): void {
    if (identifier) {
      inMemoryStore.delete(identifier);
    } else {
      inMemoryStore.clear();
    }
  }
}

export const apiRateLimiter = new RateLimiter({
  maxRequests: 60,
  windowMs: 60000,
});

export function checkRateLimit(toolName: string): { allowed: boolean; retryAfterMs?: number } {
  const result = apiRateLimiter.isRateLimited(toolName);
  return { allowed: !result.limited, retryAfterMs: result.retryAfterMs };
}
