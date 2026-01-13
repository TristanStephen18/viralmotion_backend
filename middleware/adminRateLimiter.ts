import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

// ============================================================
// ✅ PRODUCTION ONLY - All admin rate limiters disabled in development
// ============================================================

const isProduction = process.env.NODE_ENV === 'production';

const rateLimitConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
};

// Admin login rate limiter
export const adminLoginRateLimiter = isProduction
  ? rateLimit({
      ...rateLimitConfig,
      windowMs: 15 * 60 * 1000,
      max: 3,
      message: { 
        success: false,
        error: "Too many admin login attempts. Please try again in 15 minutes." 
      },
      skipSuccessfulRequests: true,
      keyGenerator: (req) => {
        const email = req.body?.email || 'unknown';
        return `admin-login:${email}`;
      },
    })
  : (req: any, res: any, next: any) => next();

// General admin operations
export const adminOperationsRateLimiter = isProduction
  ? rateLimit({
      ...rateLimitConfig,
      windowMs: 60 * 1000,
      max: 20,
      message: { 
        success: false,
        error: "Too many admin operations" 
      },
      keyGenerator: (req) => {
        const adminId = (req as any).admin?.adminId || 'unknown';
        return `admin-ops:${adminId}`;
      },
    })
  : (req: any, res: any, next: any) => next();

// Critical operations
export const adminCriticalRateLimiter = isProduction
  ? rateLimit({
      ...rateLimitConfig,
      windowMs: 60 * 60 * 1000,
      max: 5,
      message: { 
        success: false,
        error: "Critical operation limit reached" 
      },
      keyGenerator: (req) => {
        const adminId = (req as any).admin?.adminId || 'unknown';
        return `admin-critical:${adminId}`;
      },
    })
  : (req: any, res: any, next: any) => next();

// Data access
export const adminDataAccessRateLimiter = isProduction
  ? rateLimit({
      ...rateLimitConfig,
      windowMs: 60 * 1000,
      max: 10,
      message: { 
        success: false,
        error: "Too many data requests" 
      },
      keyGenerator: (req) => {
        const adminId = (req as any).admin?.adminId || 'unknown';
        return `admin-data:${adminId}`;
      },
    })
  : (req: any, res: any, next: any) => next();

// Speed limiter
export const adminSpeedLimiter = isProduction
  ? slowDown({
      windowMs: 15 * 60 * 1000,
      delayAfter: 5,
      delayMs: (hits) => hits * 300,
      validate: {
        trustProxy: false,
      },
    })
  : (req: any, res: any, next: any) => next();