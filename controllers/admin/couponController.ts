import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import { coupons, couponRedemptions, users } from "../../db/schema.ts";
import { eq, desc, ilike, or, and, gte, lte, count, sql } from "drizzle-orm";
import { logAdminAction } from "../../utils/auditLogger.ts";

export const createCoupon = async (req: Request, res: Response) => {
  const adminId = (req as any).admin?.adminId;

  try {
    const { code, description, assignedTo, expiryDate, durationDays, maxUses } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: "Coupon code is required",
      });
    }

    if (!durationDays || durationDays < 1) {
      return res.status(400).json({
        success: false,
        error: "Duration days must be at least 1",
      });
    }

    const [existing] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.code, code.toUpperCase().trim()))
      .limit(1);

    if (existing) {
      return res.status(400).json({
        success: false,
        error: "Coupon code already exists",
      });
    }

    const [newCoupon] = await db
      .insert(coupons)
      .values({
        code: code.toUpperCase().trim(),
        description: description?.trim() || null,
        assignedTo: assignedTo?.trim() || null,
        createdBy: adminId,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        durationDays: parseInt(durationDays),
        maxUses: maxUses || 1,
        currentUses: 0,
        isActive: true,
      })
      .returning();

    await logAdminAction(req, {
      adminId,
      action: "CREATE_COUPON",
      targetType: "COUPON",
      // targetId: newCoupon.code as any,
      status: "SUCCESS",
      details: {
        code: newCoupon.code,
        assignedTo: newCoupon.assignedTo,
        expiryDate: newCoupon.expiryDate,
        durationDays: newCoupon.durationDays,
        maxUses: newCoupon.maxUses,
      },
    });

    console.log(`✅ Coupon created: ${newCoupon.code} (${newCoupon.durationDays} days) by admin ${adminId}`);

    res.json({
      success: true,
      coupon: newCoupon,
      message: "Coupon created successfully",
    });
  } catch (error: any) {
    console.error("❌ Create coupon error:", error);
    res.status(500).json({ success: false, error: "Failed to create coupon" });
  }
};

export const getCoupons = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = (req.query.search as string) || "";
    const status = req.query.status as string;
    const offset = (page - 1) * limit;

    const conditions: any[] = [];

    if (search) {
      conditions.push(
        or(
          ilike(coupons.code, `%${search}%`),
          ilike(coupons.assignedTo, `%${search}%`),
          ilike(coupons.description, `%${search}%`)
        )
      );
    }

    if (status === "active") {
      conditions.push(
        and(
          eq(coupons.isActive, true),
          sql`${coupons.currentUses} < ${coupons.maxUses}`,
          or(
            sql`${coupons.expiryDate} IS NULL`,
            gte(coupons.expiryDate, new Date())
          )
        )
      );
    } else if (status === "expired") {
      conditions.push(
        and(
          lte(coupons.expiryDate, new Date()),
          sql`${coupons.expiryDate} IS NOT NULL`
        )
      );
    } else if (status === "exhausted") {
      conditions.push(sql`${coupons.currentUses} >= ${coupons.maxUses}`);
    }

    let query = db
      .select({
        coupon: coupons,
        admin: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
        redemptionCount: sql<number>`(
          SELECT COUNT(*)::int 
          FROM ${couponRedemptions} 
          WHERE ${couponRedemptions.couponId} = ${coupons.id}
        )`,
      })
      .from(coupons)
      .leftJoin(users, eq(coupons.createdBy, users.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const couponsList = await query
      .orderBy(desc(coupons.createdAt))
      .limit(limit)
      .offset(offset);

    let countQuery = db.select({ count: count() }).from(coupons);
    if (conditions.length > 0) {
      countQuery = countQuery.where(and(...conditions)) as any;
    }
    const [totalResult] = await countQuery;

    res.json({
      success: true,
      coupons: couponsList,
      pagination: {
        page,
        limit,
        total: totalResult.count,
        pages: Math.ceil(totalResult.count / limit),
      },
    });
  } catch (error: any) {
    console.error("❌ Get coupons error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getCouponDetails = async (req: Request, res: Response) => {
  try {
    const { couponId } = req.params;

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, couponId))
      .limit(1);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: "Coupon not found",
      });
    }

    const redemptions = await db
      .select({
        redemption: couponRedemptions,
        user: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(couponRedemptions)
      .leftJoin(users, eq(couponRedemptions.userId, users.id))
      .where(eq(couponRedemptions.couponId, couponId))
      .orderBy(desc(couponRedemptions.redeemedAt));

    res.json({
      success: true,
      coupon,
      redemptions,
    });
  } catch (error: any) {
    console.error("❌ Get coupon details error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const updateCoupon = async (req: Request, res: Response) => {
  const adminId = (req as any).admin?.adminId;

  try {
    const { couponId } = req.params;
    const { description, assignedTo, expiryDate, durationDays, maxUses, isActive } = req.body;

    const updates: any = { updatedAt: new Date() };

    if (description !== undefined) updates.description = description;
    if (assignedTo !== undefined) updates.assignedTo = assignedTo;
    if (expiryDate !== undefined) updates.expiryDate = expiryDate ? new Date(expiryDate) : null;
    if (durationDays !== undefined) updates.durationDays = parseInt(durationDays);
    if (maxUses !== undefined) updates.maxUses = maxUses;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db
      .update(coupons)
      .set(updates)
      .where(eq(coupons.id, couponId))
      .returning();

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: "Coupon not found",
      });
    }

    await logAdminAction(req, {
      adminId,
      action: "UPDATE_COUPON",
      targetType: "COUPON",
      // targetId: updated.code as any,
      status: "SUCCESS",
      details: {
        code: updated.code,
        changes: { description, assignedTo, expiryDate, durationDays, maxUses, isActive },
      },
    });

    res.json({
      success: true,
      coupon: updated,
      message: "Coupon updated successfully",
    });
  } catch (error: any) {
    console.error("❌ Update coupon error:", error);
    res.status(500).json({ success: false, error: "Failed to update coupon" });
  }
};

export const deactivateCoupon = async (req: Request, res: Response) => {
  const adminId = (req as any).admin?.adminId;

  try {
    const { couponId } = req.params;

    const [deactivated] = await db
      .update(coupons)
      .set({
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, couponId))
      .returning();

    if (!deactivated) {
      return res.status(404).json({
        success: false,
        error: "Coupon not found",
      });
    }

    await logAdminAction(req, {
      adminId,
      action: "DEACTIVATE_COUPON",
      targetType: "COUPON",
      // targetId: deactivated.code as any,
      status: "SUCCESS",
      details: { code: deactivated.code },
    });

    res.json({
      success: true,
      message: "Coupon deactivated successfully",
    });
  } catch (error: any) {
    console.error("❌ Deactivate coupon error:", error);
    res.status(500).json({ success: false, error: "Failed to deactivate coupon" });
  }
};

export const deleteCoupon = async (req: Request, res: Response) => {
  const adminId = (req as any).admin?.adminId;

  try {
    const { couponId } = req.params;

    const [coupon] = await db
      .select()
      .from(coupons)
      .where(eq(coupons.id, couponId))
      .limit(1);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        error: "Coupon not found",
      });
    }

    if (coupon.currentUses > 0) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete coupon that has been used. Deactivate it instead.",
      });
    }

    await db.delete(coupons).where(eq(coupons.id, couponId));

    await logAdminAction(req, {
      adminId,
      action: "DELETE_COUPON",
      targetType: "COUPON",
      // targetId: coupon.code as any,
      status: "SUCCESS",
      details: { code: coupon.code },
    });

    res.json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Delete coupon error:", error);
    res.status(500).json({ success: false, error: "Failed to delete coupon" });
  }
};