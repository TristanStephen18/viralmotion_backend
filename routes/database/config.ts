// ✅ CRITICAL: Validate JWT secrets exist and are not default
if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "super-secret-key") {
  throw new Error(
    "🚨 CRITICAL: JWT_SECRET must be set in environment variables and cannot be the default value!"
  );
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error("🚨 CRITICAL: JWT_REFRESH_SECRET must be set in environment variables!");
}

export const JWT_SECRET = process.env.JWT_SECRET;
export const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// ✅ CHANGED: Short-lived access tokens (15 minutes instead of 7 days)
export const JWT_EXPIRES_IN = "15m";

// ✅ NEW: Refresh token expiration
export const JWT_REFRESH_EXPIRES_IN = "7d";

// ✅ FIXED: Cookie configuration for both dev and production
const isDevelopment = process.env.NODE_ENV !== "production";

export const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents XSS attacks
  secure: !isDevelopment, // ✅ FIXED: false in dev, true in prod
  sameSite: isDevelopment ? "lax" as const : "none" as const, // ✅ FIXED: lax for dev, none for prod
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  path: "/",
  domain: isDevelopment ? undefined : process.env.COOKIE_DOMAIN, // ✅ FIXED: no domain in dev
};

// ✅ NEW: Access token cookie (short-lived)
export const ACCESS_TOKEN_COOKIE = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

// ✅ NEW: Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many attempts, please try again later",
};

// ✅ NEW: Account lockout configuration
export const LOCKOUT_CONFIG = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
};

// ✅ NEW: Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// ✅ CHANGED: Increased bcrypt rounds from 10 to 12
export const BCRYPT_ROUNDS = 12;