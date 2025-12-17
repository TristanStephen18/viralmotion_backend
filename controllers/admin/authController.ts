import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../../db/client.ts";
import { adminUsers } from "../../db/schema.ts";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = "7d";

// Admin login
export const adminLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: "Email and password required",
      });
    }

    // Find admin
    const [admin] = await db
      .select()
      .from(adminUsers)
      .where(eq(adminUsers.email, email.toLowerCase()));

    if (!admin || !admin.active) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.passwordHash);

    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid credentials",
      });
    }

    // Update last login
    await db
      .update(adminUsers)
      .set({ lastLogin: new Date() })
      .where(eq(adminUsers.id, admin.id));

    // Generate JWT
    const token = jwt.sign(
      {
        adminId: admin.id,
        email: admin.email,
        role: admin.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        role: admin.role,
      },
    });
  } catch (error: any) {
    console.error("Admin login error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create first admin (run once)
export const createFirstAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, name, setupKey } = req.body;

    // Check setup key (set in .env)
    if (setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(401).json({
        success: false,
        error: "Invalid setup key",
      });
    }

    // Check if any admin exists
    const existingAdmins = await db.select().from(adminUsers).limit(1);

    if (existingAdmins.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Admin already exists. Use invite system.",
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create super admin
    const [newAdmin] = await db
      .insert(adminUsers)
      .values({
        email: email.toLowerCase(),
        passwordHash,
        name,
        role: "super_admin",
      })
      .returning();

    res.json({
      success: true,
      message: "Super admin created successfully",
      admin: {
        id: newAdmin.id,
        email: newAdmin.email,
        name: newAdmin.name,
        role: newAdmin.role,
      },
    });
  } catch (error: any) {
    console.error("Create admin error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};