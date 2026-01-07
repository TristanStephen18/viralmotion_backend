import rateLimit from "express-rate-limit";
import slowDown from "express-slow-down";

// Validate trust proxy configuration
const rateLimitConfig = {
  standardHeaders: true,
  legacyHeaders: false,
  // Skip failing requests and validate trust proxy
  validate: {
    trustProxy: false, // Disable validation in development
    xForwardedForHeader: false,
  },
};

// General rate limiter (100 requests per 15 minutes)
export const generalRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: "Too many requests, please try again later" },
});

// Auth rate limiter (5 login attempts per 5 minutes)
export const authRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: { error: "Too many login attempts, please try again after 5 minutes" },
  skipSuccessfulRequests: true,
});

// Signup rate limiter (3 signups per hour per IP)
export const signupRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many accounts created, please try again later" },
});

// Password reset rate limiter (3 attempts per hour)
export const passwordResetRateLimiter = rateLimit({
  ...rateLimitConfig,
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { error: "Too many password reset attempts, please try again later" },
});

// Speed limiter (slow down repeated requests)
export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50,
  delayMs: (hits) => hits * 100,
  validate: {
    trustProxy: false,
  },
});