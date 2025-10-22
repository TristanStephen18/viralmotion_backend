import { Router } from "express";
import { requireAuth } from "../../utils/authmiddleware.ts";
import path from "path";
import {
  extractFromJsonPath,
  extractFromXlsxPath,
} from "../../utils/datasetextractor.ts";
import { datasetFormatterUsingAi } from "./gemini.ts";

const router = Router();

router.post("/", requireAuth, async (req, res) => {
  const { fileurl, type, template } = req.body;
  console.log(fileurl);
  if (!type || !fileurl) {
    return res.status(400).json({ error: "Missing type or url" });
  }
  let filedata;

  if (type === "json") {
    filedata = await extractFromJsonPath(fileurl);
  } else {
    filedata = await extractFromXlsxPath(fileurl);
  }

  try {
    const formattedData = await datasetFormatterUsingAi(
      template,
      type,
      filedata
    );

    res.json({ extractedData: formattedData });
  } catch (err) {
    res
      .status(500)
      .json({ error: "Failed to fetch Dataset data", details: String(err) });
  }
});

export default router;
