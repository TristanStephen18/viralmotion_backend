import { Router } from "express";
import * as MainRenderingController from "../controllers/rendering/RenderingCon.ts";
import * as LambdaRenderingController from "../controllers/rendering/LambdaRenderingCon.ts";

const router = Router();

router.post('/render-video', MainRenderingController.handleExport);
router.post('/render-video/lambda', LambdaRenderingController.handleLambdaRendering);
router.get('/getrenderprogress/lambda', LambdaRenderingController.checkRenderProgress);

router.get("/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

export default router;
