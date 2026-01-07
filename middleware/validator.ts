import validator from "validator";
import type { Request, Response, NextFunction } from "express";
import { PASSWORD_REQUIREMENTS } from "../routes/database/config.ts";

export const validateEmail = (email: string): boolean => {
  return validator.isEmail(email) && email.length <= 255;
};

export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < PASSWORD_REQUIREMENTS.minLength) {
    errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
  }

  if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  }

  if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  }

  if (PASSWORD_REQUIREMENTS.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  }

  // ✅ UPDATED: Added underscore (_) and hyphen (-) to special characters
  if (PASSWORD_REQUIREMENTS.requireSpecialChars && !/[!@#$%^&*(),.?":{}|<>_\-]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*(),.?\":{}|<>_-)");
  }

  return { valid: errors.length === 0, errors };
};

// ✅ NEW: Validate username
export const validateUsername = (username: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (username.length < 3 || username.length > 30) {
    errors.push("Username must be between 3 and 30 characters");
  }

  // ✅ No spaces allowed
  if (/\s/.test(username)) {
    errors.push("Username cannot contain spaces");
  }

  // ✅ Only allow alphanumeric, underscore, hyphen, and period
  if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
    errors.push("Username can only contain letters, numbers, dots, underscores, and hyphens");
  }

  // ✅ Must start with alphanumeric
  if (!/^[a-zA-Z0-9]/.test(username)) {
    errors.push("Username must start with a letter or number");
  }

  return { valid: errors.length === 0, errors };
};

export const sanitizeInput = (input: string): string => {
  return validator.trim(validator.escape(input));
};

export const validateSignupInput = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, name } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!validateEmail(email)) {
    return res.status(400).json({ error: "Invalid email address" });
  }

  const passwordCheck = validatePassword(password);
  if (!passwordCheck.valid) {
    return res.status(400).json({ error: passwordCheck.errors.join(". ") });
  }

  // ✅ NEW: Validate username format
  const usernameCheck = validateUsername(name);
  if (!usernameCheck.valid) {
    return res.status(400).json({ error: usernameCheck.errors.join(". ") });
  }

  req.body.email = validator.normalizeEmail(email) || email.toLowerCase();
  req.body.name = name.trim(); // Don't escape username

  next();
};

// ✅ UPDATED: Accept username OR email
export const validateLoginInput = (req: Request, res: Response, next: NextFunction) => {
  const { identifier, password } = req.body;

  if (!identifier || !password) {
    return res.status(400).json({ error: "Username/Email and password are required" });
  }

  // Normalize identifier (email or username)
  if (validateEmail(identifier)) {
    req.body.identifier = validator.normalizeEmail(identifier) || identifier.toLowerCase();
    req.body.isEmail = true;
  } else {
    req.body.identifier = identifier.trim();
    req.body.isEmail = false;
  }

  next();
};