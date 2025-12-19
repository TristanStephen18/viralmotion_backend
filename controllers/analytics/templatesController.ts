import type { Request, Response } from "express";
import { db } from "../../db/client.ts";
import { renders } from "../../db/schema.ts";
import { sql, and, gte, lte, desc } from "drizzle-orm";

// ✅ CORRECTED: Template name mapping (matches your database IDs)
const templatesWithTheirIds: Record<string, string> = {
  "1": "Quote Template",
  "2": "Text Typing Template",
  "3": "Bar Graph Analytics",
  "4": "Kpi Flip Cards",
  "5": "Curve Line Trend",
  "6": "Split Screen Video",
  "7": "Fact Cards Template",
  "8": "Ken Burns Carousel",
  "9": "Fake Text Conversation",
  "10": "Reddit Post Narration",
  "11": "Ai Story Narration",
  "12": "Kinetic Typography",
  "13": "Neon Flicker",
  "14": "Heat Map",
  "15": "Flip Cards",
  "16": "Parallax",
  "17": "Neon Tube",
  "18": "Retro Neon Text",
  "19": "Collage",
};

export const getMostUsedTemplates = async (req: Request, res: Response) => {
  try {
    const year = req.query.year
      ? parseInt(req.query.year as string)
      : new Date().getFullYear();

    console.log(`📊 Fetching most used templates for year: ${year}`);

    // Get start and end of year
    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    // Query all renders in that year, grouped by templateId
    const templates = await db
      .select({
        templateId: renders.templateId,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(renders)
      .where(
        and(
          gte(renders.renderedAt, startDate),
          lte(renders.renderedAt, endDate)
        )
      )
      .groupBy(renders.templateId)
      .orderBy(desc(sql`count(*)`))
      .limit(1);

    if (templates.length === 0) {
      console.log(`⚠️ No templates found for year ${year}`);
      return res.json({
        success: true,
        data: {
          templateName: "No data yet",
          count: 0,
          year,
        },
      });
    }

    const topTemplate = templates[0];
    
    // ✅ FIXED: Now correctly maps numeric IDs to template names
    const templateName =
      templatesWithTheirIds[topTemplate.templateId] || "Unknown Template";

    console.log(
      `✅ Most used template in ${year}: ${templateName} (${topTemplate.count} uses) - Template ID: ${topTemplate.templateId}`
    );

    res.json({
      success: true,
      data: {
        templateName,
        count: Number(topTemplate.count),
        templateId: topTemplate.templateId,
        year,
      },
    });
  } catch (error: any) {
    console.error("❌ Get most used templates error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to fetch template statistics",
    });
  }
};

// Optional: Get top N templates (for future use)
export const getTopTemplates = async (req: Request, res: Response) => {
  try {
    const year = req.query.year
      ? parseInt(req.query.year as string)
      : new Date().getFullYear();
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

    const startDate = new Date(`${year}-01-01T00:00:00.000Z`);
    const endDate = new Date(`${year}-12-31T23:59:59.999Z`);

    const templates = await db
      .select({
        templateId: renders.templateId,
        count: sql<number>`cast(count(*) as integer)`,
      })
      .from(renders)
      .where(
        and(
          gte(renders.renderedAt, startDate),
          lte(renders.renderedAt, endDate)
        )
      )
      .groupBy(renders.templateId)
      .orderBy(desc(sql`count(*)`))
      .limit(limit);

    const results = templates.map((t) => ({
      templateId: t.templateId,
      templateName: templatesWithTheirIds[t.templateId] || "Unknown Template",
      count: Number(t.count),
    }));

    res.json({
      success: true,
      data: results,
      year,
    });
  } catch (error: any) {
    console.error("Get top templates error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};