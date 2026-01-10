import type { Request, Response } from "express";
import {
  getRenderProgress,
  renderMediaOnLambda,
} from "@remotion/lambda/client";
// Start render endpoint
export const handleLambdaRendering = async (req: Request, res: Response) => {
  const { inputProps, format, templateId } = req.body;
  
  try {
    const { renderId, bucketName } = await renderMediaOnLambda({
      concurrency: 7,
      region: "us-east-1",
      functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
      serveUrl: "https://remotionlambda-useast1-0l1u2rw3fu.s3.us-east-1.amazonaws.com/sites/viral-motion/index.html",
      composition: templateId === "7" ? "ExtendedDynamicComposition": "DynamicVideo",
      codec: format === "mp4" ? "h264" : "h264",
      inputProps,
      privacy: "public",
    });

    // Return renderId immediately
    res.json({ 
      renderId, 
      bucketName,
      message: 'Render started' 
    });
  } catch (error) {
    console.error("Render error:", error);
    res.status(500).json({ error: error.message });
  }
};

// Progress check endpoint
export const checkRenderProgress = async (req: Request, res: Response) => {
  const { renderId, bucketName } = req.query;
  
  try {
    const progress = await getRenderProgress({
      renderId: renderId as string,
      bucketName: bucketName as string,
      functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
      region: "us-east-1",
    });

    res.json({
      done: progress.done,
      overallProgress: progress.overallProgress, // 0 to 1
      renderedFrames: progress.framesRendered,
      encodedFrames: progress.encodingStatus.framesEncoded,
      outputFile: progress.outputFile, // Available when done
      timeToFinish: progress.timeToFinish,
      errors: progress.errors,
    });
  } catch (error) {
    console.error("Progress check error:", error);
    res.status(500).json({ error: error.message });
  }
};