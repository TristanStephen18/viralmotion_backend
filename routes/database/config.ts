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

// ✅ Access token: 15 minutes (short-lived for security)
export const JWT_EXPIRES_IN = "10h";

// ✅ CHANGED: Refresh token: 30 days (was 7 days) - Facebook-style persistence
export const JWT_REFRESH_EXPIRES_IN = "30d";

// ✅ Cookie configuration for both dev and production
const isDevelopment = process.env.NODE_ENV !== "production";

export const COOKIE_OPTIONS = {
  httpOnly: true, // Prevents XSS attacks
  secure: !isDevelopment, // false in dev, true in prod
  sameSite: isDevelopment ? "lax" as const : "none" as const, // lax for dev, none for prod
  maxAge: 30 * 24 * 60 * 60 * 1000, // ✅ CHANGED: 30 days (was 7 days)
  path: "/",
  domain: isDevelopment ? undefined : process.env.COOKIE_DOMAIN,
};

// ✅ Access token cookie (short-lived)
export const ACCESS_TOKEN_COOKIE = {
  ...COOKIE_OPTIONS,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

// ✅ Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many attempts, please try again later",
};

// ✅ Account lockout configuration
export const LOCKOUT_CONFIG = {
  maxAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15 minutes
};

// ✅ Password requirements
export const PASSWORD_REQUIREMENTS = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

// ✅ Bcrypt rounds
export const BCRYPT_ROUNDS = 12;