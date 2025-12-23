import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

const rateLimitConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  validate: {
    trustProxy: false,
  },
};

// ✅ CRITICAL: Admin login rate limiter (VERY STRICT - no roles to protect)
export const adminLoginRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Only 3 attempts per 15 minutes per IP+email
  message: { 
    success: false,
    error: "Too many admin login attempts. Account locked for 15 minutes for security." 
  },
  skipSuccessfulRequests: true,
  // ✅ FIXED: Simple key without IP manipulation
  keyGenerator: (req) => {
    const email = req.body?.email || 'unknown';
    // Don't include IP in key - let express-rate-limit handle IP automatically
    return `admin-login:${email}`;
  },
});

// ✅ General admin operations (very strict since all admins are superadmins)
export const adminOperationsRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 1000, // 1 minute
  max: 20, // Max 20 operations per minute
  message: { 
    success: false,
    error: "Too many admin operations. Please slow down." 
  },
  // ✅ FIXED: Use admin ID from request, not IP
  keyGenerator: (req) => {
    const adminId = (req as any).admin?.adminId || 'unknown';
    return `admin-ops:${adminId}`;
  },
});

// ✅ CRITICAL operations (delete, grant/revoke lifetime) - VERY STRICT
export const adminCriticalRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // Only 5 critical operations per hour
  message: { 
    success: false,
    error: "Critical operation limit reached. Maximum 5 critical operations per hour for security." 
  },
  // ✅ FIXED: Use admin ID from request, not IP
  keyGenerator: (req) => {
    const adminId = (req as any).admin?.adminId || 'unknown';
    return `admin-critical:${adminId}`;
  },
});

// ✅ User data access rate limiter (prevent mass data scraping)
export const adminDataAccessRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Max 10 user detail views per minute
  message: { 
    success: false,
    error: "Too many user data requests. Please slow down." 
  },
  // ✅ FIXED: Use admin ID from request, not IP
  keyGenerator: (req) => {
    const adminId = (req as any).admin?.adminId || 'unknown';
    return `admin-data:${adminId}`;
  },
});

// ✅ Speed limiter for all admin routes
export const adminSpeedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 5, // Start slowing down after just 5 requests
  delayMs: (hits) => hits * 300, // Add 300ms delay per request
  validate: {
    trustProxy: false,
  },
  // ✅ No custom keyGenerator needed - uses default IP-based limiting
});