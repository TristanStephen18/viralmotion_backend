import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

const isProduction = process.env.NODE_ENV === 'production';

const rateLimitConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
};

// General rate limiter
export const generalRateLimiter = isProduction 
  ? rateLimit({
      ...rateLimitConfig,
      windowMs: 10 * 60 * 1000,
      max: 1000,
      message: { error: "Too many requests, please try again later" },
    })
  : (req: any, res: any, next: any) => next();

// Auth rate limiter
export const authRateLimiter = isProduction
  ? rateLimit({
      ...rateLimitConfig,
      windowMs: 5 * 60 * 1000,
      max: 5,
      message: { error: "Too many login attempts" },
      skipSuccessfulRequests: true,
    })
  : (req: any, res: any, next: any) => next();

// Signup rate limiter
export const signupRateLimiter = isProduction
  ? rateLimit({
      ...rateLimitConfig,
      windowMs: 60 * 60 * 1000,
      max: 3,
      message: { error: "Too many accounts created" },
    })
  : (req: any, res: any, next: any) => next();

// Password reset rate limiter
export const passwordResetRateLimiter = isProduction
  ? rateLimit({
      ...rateLimitConfig,
      windowMs: 60 * 60 * 1000,
      max: 3,
      message: { error: "Too many password reset attempts" },
    })
  : (req: any, res: any, next: any) => next();

// ✅ NEW: Usage check rate limiter (very lenient - these are read-only checks)
export const usageCheckRateLimiter = isProduction
  ? rateLimit({
      ...rateLimitConfig,
      windowMs: 60 * 1000, // 1 minute
      max: 300, // 300 requests per minute (5 per second)
      message: { error: "Too many usage checks, please slow down" },
      skipSuccessfulRequests: false,
      // ✅ Use user token for rate limiting (not IP)
      keyGenerator: (req) => {
        const authHeader = req.headers.authorization;
        if (authHeader?.startsWith("Bearer ")) {
          const token = authHeader.substring(7);
          return `usage_${token.substring(0, 20)}`;
        }
        return req.ip || "anonymous";
      },
    })
  : (req: any, res: any, next: any) => next();

// Speed limiter
export const speedLimiter = isProduction
  ? slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: 50,
      delayMs: (hits) => hits * 100,
      validate: {
        trustProxy: false,
      },
    })
  : (req: any, res: any, next: any) => next();