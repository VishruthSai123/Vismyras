/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  storageKey: string;
}

interface RateLimitRecord {
  timestamps: number[];
  lastReset: number;
}

export class RateLimitError extends Error {
  public readonly retryAfter: number;
  public readonly remainingRequests: number;

  constructor(message: string, retryAfter: number, remainingRequests: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.remainingRequests = remainingRequests;
  }
}

export class RateLimiter {
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  private getRecord(): RateLimitRecord {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to load rate limit record:', e);
    }
    return { timestamps: [], lastReset: Date.now() };
  }

  private saveRecord(record: RateLimitRecord): void {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(record));
    } catch (e) {
      console.error('Failed to save rate limit record:', e);
    }
  }

  private cleanOldTimestamps(timestamps: number[], now: number): number[] {
    const cutoff = now - this.config.windowMs;
    return timestamps.filter(ts => ts > cutoff);
  }

  public checkLimit(): { allowed: boolean; remaining: number; retryAfter: number } {
    const now = Date.now();
    const record = this.getRecord();
    
    // Clean old timestamps outside the current window
    const validTimestamps = this.cleanOldTimestamps(record.timestamps, now);
    
    const remaining = this.config.maxRequests - validTimestamps.length;
    
    if (remaining <= 0) {
      // Find the oldest timestamp to calculate retry time
      const oldestTimestamp = Math.min(...validTimestamps);
      const retryAfter = Math.ceil((oldestTimestamp + this.config.windowMs - now) / 1000);
      
      return { allowed: false, remaining: 0, retryAfter };
    }
    
    return { allowed: true, remaining, retryAfter: 0 };
  }

  public consumeRequest(): void {
    const now = Date.now();
    const record = this.getRecord();
    
    // Clean old timestamps
    record.timestamps = this.cleanOldTimestamps(record.timestamps, now);
    
    // Add current timestamp
    record.timestamps.push(now);
    
    this.saveRecord(record);
  }

  public getRemainingRequests(): number {
    const now = Date.now();
    const record = this.getRecord();
    const validTimestamps = this.cleanOldTimestamps(record.timestamps, now);
    return Math.max(0, this.config.maxRequests - validTimestamps.length);
  }

  public reset(): void {
    localStorage.removeItem(this.config.storageKey);
  }

  public getStats(): { used: number; remaining: number; total: number; resetIn: number } {
    const now = Date.now();
    const record = this.getRecord();
    const validTimestamps = this.cleanOldTimestamps(record.timestamps, now);
    const used = validTimestamps.length;
    const remaining = Math.max(0, this.config.maxRequests - used);
    
    let resetIn = 0;
    if (validTimestamps.length > 0) {
      const oldestTimestamp = Math.min(...validTimestamps);
      resetIn = Math.ceil((oldestTimestamp + this.config.windowMs - now) / 1000);
    }
    
    return {
      used,
      remaining,
      total: this.config.maxRequests,
      resetIn
    };
  }
}

// Create rate limiters for different operations
// Free tier limits: 15 RPM, 1500 RPD
export const rateLimiters = {
  // Per-minute limiter (conservative to avoid hitting API limits)
  perMinute: new RateLimiter({
    maxRequests: 10, // Conservative: 10 requests per minute (API allows 15)
    windowMs: 60 * 1000, // 1 minute
    storageKey: 'vismyras_rate_limit_minute'
  }),
  
  // Per-hour limiter (to spread usage throughout the day)
  perHour: new RateLimiter({
    maxRequests: 100, // 100 requests per hour
    windowMs: 60 * 60 * 1000, // 1 hour
    storageKey: 'vismyras_rate_limit_hour'
  }),
  
  // Per-day limiter (API allows 1500, we'll use 1000 to be safe)
  perDay: new RateLimiter({
    maxRequests: 1000,
    windowMs: 24 * 60 * 60 * 1000, // 24 hours
    storageKey: 'vismyras_rate_limit_day'
  })
};

export function checkAllLimits(): void {
  // Check minute limit (most restrictive)
  const minuteCheck = rateLimiters.perMinute.checkLimit();
  if (!minuteCheck.allowed) {
    throw new RateLimitError(
      `You're making requests too quickly! Please wait ${minuteCheck.retryAfter} seconds before trying again. This helps us stay within free API limits. 😊`,
      minuteCheck.retryAfter,
      0
    );
  }
  
  // Check hour limit
  const hourCheck = rateLimiters.perHour.checkLimit();
  if (!hourCheck.allowed) {
    const minutes = Math.ceil(hourCheck.retryAfter / 60);
    throw new RateLimitError(
      `You've used your hourly quota of requests. Please wait ${minutes} minutes before trying again. The free tier has limits to keep costs down. 🕐`,
      hourCheck.retryAfter,
      0
    );
  }
  
  // Check day limit
  const dayCheck = rateLimiters.perDay.checkLimit();
  if (!dayCheck.allowed) {
    const hours = Math.ceil(dayCheck.retryAfter / 3600);
    throw new RateLimitError(
      `You've reached your daily limit of 1000 requests. Your quota will reset in ${hours} hours. Consider upgrading to paid tier for unlimited usage! 🚀`,
      dayCheck.retryAfter,
      0
    );
  }
  
  // If all checks pass, consume a request from each limiter
  rateLimiters.perMinute.consumeRequest();
  rateLimiters.perHour.consumeRequest();
  rateLimiters.perDay.consumeRequest();
}

export function formatRetryTime(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  } else if (seconds < 3600) {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.ceil(seconds / 3600);
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
}
