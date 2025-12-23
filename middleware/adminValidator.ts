import type { Request, Response, NextFunction } from "express";
import validator from "validator";

export const validateUserId = (req: Request, res: Response, next: NextFunction) => {
  try {
    // ✅ Direct access - no destructuring
    const userId = req.params?.userId || req.body?.userId;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "User ID is required",
      });
    }

    const userIdNum = parseInt(String(userId), 10);

    if (isNaN(userIdNum) || userIdNum <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invalid user ID format",
      });
    }

    // ✅ Safely set the validated value
    if (req.params && 'userId' in req.params) {
      req.params.userId = String(userIdNum);
    }
    if (req.body && 'userId' in req.body) {
      req.body.userId = userIdNum;
    }

    next();
  } catch (error) {
    console.error("❌ validateUserId error:", error);
    return res.status(400).json({
      success: false,
      error: "Invalid user ID",
    });
  }
};

// ✅ Rest of validators stay the same...
export const validateGrantLifetime = (req: Request, res: Response, next: NextFunction) => {
  const { companyName, notes } = req.body || {};

  if (companyName && companyName.length > 255) {
    return res.status(400).json({
      success: false,
      error: "Company name too long (max 255 characters)",
    });
  }

  if (notes && notes.length > 1000) {
    return res.status(400).json({
      success: false,
      error: "Notes too long (max 1000 characters)",
    });
  }

  if (companyName) {
    req.body.companyName = validator.escape(companyName.trim());
  }

  if (notes) {
    req.body.notes = validator.escape(notes.trim());
  }

  next();
};

export const validateCreateLifetimeAccount = (req: Request, res: Response, next: NextFunction) => {
  const { email, name, companyName, notes } = req.body || {};

  if (!email) {
    return res.status(400).json({
      success: false,
      error: "Email is required",
    });
  }

  if (!validator.isEmail(email)) {
    return res.status(400).json({
      success: false,
      error: "Invalid email format",
    });
  }

  req.body.email = validator.normalizeEmail(email.trim()) || email.trim();

  if (name && name.length > 255) {
    return res.status(400).json({
      success: false,
      error: "Name too long (max 255 characters)",
    });
  }

  if (companyName && companyName.length > 255) {
    return res.status(400).json({
      success: false,
      error: "Company name too long (max 255 characters)",
    });
  }

  if (notes && notes.length > 1000) {
    return res.status(400).json({
      success: false,
      error: "Notes too long (max 1000 characters)",
    });
  }

  if (name) {
    req.body.name = validator.escape(name.trim());
  }

  if (companyName) {
    req.body.companyName = validator.escape(companyName.trim());
  }

  if (notes) {
    req.body.notes = validator.escape(notes.trim());
  }

  next();
};

export const validateUserListQuery = (req: Request, res: Response, next: NextFunction) => {
  const query = req.query || {};
  const { page, limit, search, sortBy, sortOrder } = query;

  if (page) {
    const pageNum = parseInt(page as string, 10);
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({
        success: false,
        error: "Invalid page number",
      });
    }
  }

  if (limit) {
    const limitNum = parseInt(limit as string, 10);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({
        success: false,
        error: "Invalid limit (1-100)",
      });
    }
  }

  if (search && (search as string).length > 100) {
    return res.status(400).json({
      success: false,
      error: "Search query too long (max 100 characters)",
    });
  }

  if (sortBy) {
    const allowedSortFields = ["id", "email", "name", "createdAt", "lastLogin"];
    if (!allowedSortFields.includes(sortBy as string)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sort field",
      });
    }
  }

  if (sortOrder && !["asc", "desc"].includes((sortOrder as string).toLowerCase())) {
    return res.status(400).json({
      success: false,
      error: "Invalid sort order (must be 'asc' or 'desc')",
    });
  }

  next();
};