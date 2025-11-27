import type { Request, Response } from "express";
import {
  getRenderProgress,
  renderMediaOnLambda,
} from "@remotion/lambda/client";

export const handleLambdaRendering = async (req: Request, res: Response) => {
  const { inputProps, compositionId, format } = req.body;
  console.log(inputProps);
  try {
    const { renderId, bucketName } = await renderMediaOnLambda({
      concurrency: 5,
      region: "ap-southeast-2",
      functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
      serveUrl: "https://remotionlambda-apsoutheast2-ex0ngw5vgv.s3.ap-southeast-2.amazonaws.com/sites/viral_motio2/index.html",
      composition: compositionId,
      codec: format === "mp4" ? "h264" : "h264",
      inputProps,
      privacy: "public",
    });
    let progress = await getRenderProgress({
      renderId,
      bucketName,
      functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
      region: "ap-southeast-2",
    });

    while (!progress.done) {
      await new Promise((resolve) => setTimeout(resolve, 10000));
      progress = await getRenderProgress({
        renderId,
        bucketName,
        functionName: "remotion-render-4-0-377-mem2048mb-disk2048mb-120sec",
        region: "ap-southeast-2",
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
