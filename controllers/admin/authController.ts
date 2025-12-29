import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../db/client.ts";
import { adminUsers } from "../../db/schema.ts";
import { eq } from "drizzle-orm";
import { logAdminAction, ADMIN_ACTIONS } from "../../utils/auditLogger.ts";
import {
  ADMIN_JWT_EXPIRES_IN,
  blacklistToken,
} from "../../middleware/adminAuth.ts";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("CRITICAL: JWT_SECRET environment variable is not set!");
}

// ✅ STRICT password requirements for all admins
const ADMIN_PASSWORD_REQUIREMENTS = {
  minLength: 14, // Longer than users
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
};

const validateAdminPassword = (
  password: string
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (password.length < ADMIN_PASSWORD_REQUIREMENTS.minLength) {
    errors.push(
      `Password must be at least ${ADMIN_PASSWORD_REQUIREMENTS.minLength} characters`
    );
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain uppercase letters");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain lowercase letters");
  }
  if (!/\d/.test(password)) {
    errors.push("Password must contain numbers");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("Password must contain special characters");
  }

  return { valid: errors.length === 0, errors };
};

// ✅ Admin login with enhanced security
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password required",
      });
    }

    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase()));

    if (!admin || !admin.active) {
      if (admin) {
        await logAdminAction(req, {
          adminId: admin.id,
          action: ADMIN_ACTIONS.LOGIN_FAILED,
          status: "FAILED",
          targetEmail: email,
          errorMessage: admin.active ? "Invalid password" : "Account disabled",
        });
      }

      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      await logAdminAction(req, {
        adminId: admin.id,
        action: ADMIN_ACTIONS.LOGIN_FAILED,
        status: "FAILED",
        targetEmail: email,
        errorMessage: "Invalid password",
      });

      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // ✅ Update last login
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, admin.id));

    // ✅ Generate JWT with SHORT expiry
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES_IN }
    );

    await logAdminAction(req, {
      adminId: admin.id,
      action: ADMIN_ACTIONS.LOGIN,
      status: "SUCCESS",
      details: {
        ipAddress: req.ip || req.socket.remoteAddress,
        userAgent: req.headers["user-agent"],
      },
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
      expiresIn: ADMIN_JWT_EXPIRES_IN,
      // ✅ Warn about session timeout
      sessionWarning: "Admin sessions expire after 1 hour for security.",
    });
  } catch (error: any) {
    console.error("❌ Admin login error:", error);
    res.status(500).json({
      success: false,
      error: "Login failed",
    });
  }
};

// ✅ Admin logout (blacklist token)
export const adminLogout = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const admin = (req as any).admin;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);

      // Calculate expiry (1 hour from now)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      await blacklistToken(token, expiresAt);
    }

    if (admin) {
      await logAdminAction(req, {
        adminId: admin.adminId,
        action: ADMIN_ACTIONS.LOGOUT,
        status: "SUCCESS",
      });
    }

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error: any) {
    console.error("❌ Admin logout error:", error);
    res.status(500).json({
      success: false,
      error: "Logout failed",
    });
  }
};

// ✅ Create first admin
export const createFirstAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, name, setupKey } = req.body;

    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(401).json({
        success: false,
        error: "Invalid setup key",
      });
    }

    const existingAdmins = await db.select().from(adminUsers).limit(1);

    if (existingAdmins.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Admin already exists",
      });
    }

    const passwordCheck = validateAdminPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: passwordCheck.errors.join(". "),
      });
    }

    // ✅ Hash with high cost factor
    const passwordHash = await bcrypt.hash(password, 12);

    const [newAdmin] = await db
      .insert(adminUsers)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: "admin", // Since all admins are equal
      })
      .returning();

    console.log(`✅ First admin created: ${newAdmin.email}`);

    res.json({
      success: true,
      message: "Admin created successfully",
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
      },
    });
  } catch (error: any) {
    console.error("❌ Create admin error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to create admin",
    });
  }
};

// ✅ Generate re-auth token (for critical operations)
export const generateReAuthToken = async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const admin = (req as any).admin;

    if (!admin || !password) {
      return res.status(400).json({
        success: false,
        error: "Password required for confirmation",
      });
    }

    const [adminUser] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, admin.adminId));

    if (!adminUser) {
      return res.status(401).json({
        success: false,
        error: "Admin not found",
      });
    }

    const isValid = await bcrypt.compare(password, adminUser.passwordHash);

    if (!isValid) {
      await logAdminAction(req, {
        adminId: admin.adminId,
        action: ADMIN_ACTIONS.REAUTH_FAILED,
        status: "FAILED",
        errorMessage: "Invalid password",
      });

      return res.status(401).json({
        success: false,
        error: "Invalid password",
      });
    }

    // ✅ Generate very short-lived re-auth token (2 minutes)
    const reAuthToken = jwt.sign(
      {
        adminId: admin.adminId,
        purpose: "reauth",
      },
      JWT_SECRET,
      { expiresIn: "2m" }
    );

    await logAdminAction(req, {
      adminId: admin.adminId,
      action: ADMIN_ACTIONS.REAUTH_SUCCESS,
      status: "SUCCESS",
    });

    res.json({
      success: true,
      reAuthToken,
      expiresIn: "2m",
      message:
        "Password confirmed. You have 2 minutes to complete this action.",
    });
  } catch (error: any) {
    console.error("❌ Re-auth error:", error);
    res.status(500).json({
      success: false,
      error: "Re-authentication failed",
    });
  }
};

// ✅ NEW: Create additional admin (requires existing admin auth + re-auth)
export const createAdminUser = async (req: Request, res: Response) => {
  const creatorAdminId = (req as any).admin?.adminId;

  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: "Email, password, and name are required",
      });
    }

    // ✅ Validate password strength
    const passwordCheck = validateAdminPassword(password);
    if (!passwordCheck.valid) {
      return res.status(400).json({
        success: false,
        error: passwordCheck.errors.join(". "),
      });
    }

    // ✅ Check if email already exists
    const [existingAdmin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase()));

    if (existingAdmin) {
      await logAdminAction(req, {
        adminId: creatorAdminId,
        action: "CREATE_ADMIN_USER_FAILED",
        targetType: "ADMIN",
        targetEmail: email,
        status: "FAILED",
        errorMessage: "Email already exists",
      });

      return res.status(400).json({
        success: false,
        error: "An admin with this email already exists",
      });
    }

    // ✅ Hash password with high cost factor
    const passwordHash = await bcrypt.hash(password, 12);

    // ✅ Create new admin
    const [newAdmin] = await db
      .insert(adminUsers)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: "admin", // All admins have equal access
        active: true,
      })
      .returning();

    // ✅ Log successful creation
    await logAdminAction(req, {
      adminId: creatorAdminId,
      action: "CREATE_ADMIN_USER",
      targetType: "ADMIN",
      targetId: newAdmin.id,
      targetEmail: newAdmin.email,
      status: "SUCCESS",
      details: {
        createdAdminName: newAdmin.name,
        createdAdminEmail: newAdmin.email,
      },
    });

    console.log(
      `✅ New admin created: ${newAdmin.email} by admin ${creatorAdminId}`
    );

    res.json({
      success: true,
      message: "Admin user created successfully",
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
      },
    });
  } catch (error: any) {
    console.error("❌ Create admin user error:", error);

    // ✅ Log failed creation
    await logAdminAction(req, {
      adminId: creatorAdminId,
      action: "CREATE_ADMIN_USER_FAILED",
      targetType: "ADMIN",
      targetEmail: req.body.email,
      status: "FAILED",
      errorMessage: error.message,
    });

    res.status(500).json({
      success: false,
      error: "Failed to create admin user",
    });
  }
};
// ✅ NEW: Extend admin session (requires re-auth)
export const extendAdminSession = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // ✅ Generate new token with extended expiry
    const newToken = jwt.sign(
      {
        adminId: admin.adminId,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: ADMIN_JWT_EXPIRES_IN }
    );

    await logAdminAction(req, {
      adminId: admin.adminId,
      action: "EXTEND_SESSION",
      status: "SUCCESS",
    });

    res.json({
      success: true,
      token: newToken,
      expiresIn: ADMIN_JWT_EXPIRES_IN,
      message: "Session extended successfully",
    });
  } catch (error: any) {
    console.error("❌ Extend session error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to extend session",
    });
  }
};

// ✅ ENHANCED: Change admin password with optional logout all devices
export const changeAdminPassword = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const { currentPassword, newPassword, logoutAllDevices } = req.body;

    console.log("🔐 Change password request received for admin:", admin.adminId);

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Validate passwords
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    // Password requirements (14+ chars, uppercase, lowercase, number, special)
    if (newPassword.length < 14) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 14 characters",
      });
    }

    if (
      !/[A-Z]/.test(newPassword) ||
      !/[a-z]/.test(newPassword) ||
      !/[0-9]/.test(newPassword) ||
      !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPassword)
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Password must contain uppercase, lowercase, number, and special character",
      });
    }

    // ✅ Get admin from database with all fields
    const adminUsers_result = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.id, admin.adminId))
      .limit(1);

    console.log("📊 Query result:", {
      found: adminUsers_result.length > 0,
      fields: adminUsers_result[0] ? Object.keys(adminUsers_result[0]) : [],
    });

    const [adminUser] = adminUsers_result;

    if (!adminUser) {
      return res.status(404).json({
        success: false,
        error: "Admin not found",
      });
    }

    // ✅ Check if passwordHash exists
    if (!adminUser.passwordHash) {
      console.error("❌ passwordHash is missing from admin user:", {
        id: adminUser.id,
        email: adminUser.email,
        availableFields: Object.keys(adminUser),
      });
      return res.status(500).json({
        success: false,
        error: "Password hash not found in database",
      });
    }

    console.log("✅ passwordHash found, comparing passwords...");

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      currentPassword,
      adminUser.passwordHash
    );

    if (!isValidPassword) {
      console.log("❌ Current password is incorrect");
      await logAdminAction(req, {
        adminId: admin.adminId,
        action: "CHANGE_PASSWORD",
        status: "FAILED",
        errorMessage: "Invalid current password",
      });

      return res.status(400).json({
        success: false,
        error: "Current password is incorrect",
      });
    }

    console.log("✅ Current password verified, hashing new password...");

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and optionally passwordChangedAt
    const updateData: any = {
      passwordHash: hashedPassword,
    };

    // Only update passwordChangedAt if logging out all devices
    if (logoutAllDevices) {
      updateData.passwordChangedAt = new Date();
      console.log("🔄 Will log out all devices");
    }

    console.log("💾 Updating password in database...");

    await db
      .update(adminUsers)
      .set(updateData)
      .where(eq(adminUsers.id, admin.adminId));

    console.log("✅ Password updated successfully");

    await logAdminAction(req, {
      adminId: admin.adminId,
      action: "CHANGE_PASSWORD",
      status: "SUCCESS",
      details: {
        logoutAllDevices: logoutAllDevices || false,
      },
    });

    res.json({
      success: true,
      message: logoutAllDevices
        ? "Password changed successfully. All sessions have been logged out."
        : "Password changed successfully",
    });
  } catch (error: any) {
    console.error("❌ Change password error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({
      success: false,
      error: "Failed to change password",
    });
  }
};

// ✅ FIXED: Update admin profile (requires re-auth)
export const updateAdminProfile = async (req: Request, res: Response) => {
  try {
    const admin = (req as any).admin;
    const { name } = req.body;

    if (!admin) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    // Validate name
    if (!name || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: "Name must be at least 2 characters",
      });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({
        success: false,
        error: "Name must be less than 100 characters",
      });
    }

    // Update admin name
    await db
      .update(adminUsers)
      .set({
        name: name.trim(),
      })
      .where(eq(adminUsers.id, admin.adminId));

    // ✅ NEW: Fetch updated admin data
    const [updatedAdmin] = await db
      .select({
        id: adminUsers.id,
        email: adminUsers.email,
        name: adminUsers.name,
        role: adminUsers.role,
        lastLogin: adminUsers.lastLogin,
      })
      .from(adminUsers)
      .where(eq(adminUsers.id, admin.adminId))
      .limit(1);

    await logAdminAction(req, {
      adminId: admin.adminId,
      action: "UPDATE_PROFILE",
      status: "SUCCESS",
      details: {
        oldName: admin.name,
        newName: name.trim(),
      },
    });

    // ✅ NEW: Return updated admin object
    res.json({
      success: true,
      message: "Profile updated successfully",
      admin: updatedAdmin, // ✅ Include updated admin
    });
  } catch (error: any) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({
      success: false,
      error: "Failed to update profile",
    });
  }
};
