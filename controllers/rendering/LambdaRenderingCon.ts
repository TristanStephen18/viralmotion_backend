import type { Request, Response } from "express";
import {
  getRenderProgress,
  renderMediaOnLambda,
} from "@remotion/lambda/client";

export const handleLambdaRendering = async (req: Request, res: Response) => {
  const { inputProps, format } = req.body;
  console.log(inputProps);
  try {
    const { renderId, bucketName } = await renderMediaOnLambda({
      concurrency: 5,
      region: "us-east-1",
      functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
      serveUrl: "https://remotionlambda-useast1-0l1u2rw3fu.s3.us-east-1.amazonaws.com/sites/viral-motion/index.html",
      composition: "DynamicVideo",
      codec: format === "mp4" ? "h264" : "h264",
      inputProps,
      privacy: "public",
    });
    let progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
      region: "us-east-1",
    });

    while (!progress.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
        region: "us-east-1",
      });
    }
    console.log("rendering finished!!\nUrl: ", progress.outputFile)

    // Return the S3 URL
    res.json({ url: progress.outputFile });
  } catch (error) {
    console.error("Render error:", error);
    res.status(500).json({ error: error.message });
  }
};
