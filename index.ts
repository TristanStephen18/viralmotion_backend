import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";
import rateLimit from "express-rate-limit";

// Security middleware
import { generalRateLimiter, speedLimiter } from "./middleware/rateLimiter.ts";
import { securityHeaders } from "./middleware/securityHeaders.ts";
import { cleanupExpiredTokens } from "./utils/tokens.ts";
import proxyRoutes from './routes/proxy.ts';

// Import routes
import airoutes from "./routes/apis/gemini.ts";
import renderingroutes from "./routes/rendering.ts";
import uploadroutes from "./routes/uploads.ts";
import elevenlabsroutes from "./routes/apis/elevenlabs.ts";
import redditroute from "./routes/apis/reddit.ts";
import authroutes from "./routes/database/auth.ts";
import projectsroutes from "./routes/database/projects.ts";
import uploadindbroutes from "./routes/database/useruploads.ts";
import pixabayroutes from "./routes/apis/pixabay.ts";
import rendersroutes from "./routes/database/renders.ts";
import datasetsdbupload from "./routes/database/datasetsupload.ts";
import getDatasetFronUploadsroute from "./routes/apis/fromuploadsextraction.ts";
import GoogleRoutes from "./routes/google.ts";
import removeBgroutes from "./routes/apis/removebg.ts";
import seeDreamRoutes from "./routes/apis/seeDream.ts";
import huggingFaceRoutes from "./routes/apis/huggingFace.ts";
import geminiImageGenRoutes from "./routes/apis/imagegeneration/gemini.ts";
import openAiImageGenRoutes from "./routes/apis/imagegeneration/openai.ts";
import huggingFaceVideoGenroutes from "./routes/apis/videogeneration/huggingface.ts";
import tavusRoutes from "./routes/apis/videogeneration/tavus.ts";
import veoRoutes from "./routes/tools/veo.ts";
import ytRoutes from "./routes/tools/yt_2.ts";
import audioRoutes from "./routes/tools/audio.ts";
import enhanceSpeechRoutes from "./routes/tools/enhanceSpeech.ts";
import veo3Routes from "./routes/apis/veo3.ts";
import youtubeRoutes from "./routes/apis/youtube.ts";
import saveImageRoutes from "./utils/saveImage.ts";
import imageGenRoutes from "./routes/tools/imageGen.ts";
import subscriptionRoutes from "./routes/subscription.ts";
import ssToCloudinaryRoutes from "./utils/screenshotSaver.ts";
import { handleStripeWebhook } from "./controllers/subscription/webhookController.ts";
import adminRoutes from "./routes/admin.ts";
import analyticsRoutes from "./routes/analytics.ts";
import promptImprovementRoutes from "./routes/apis/promptImprovement.ts";
import bunnyRoutes from './routes/apis/bunny.ts';
import usageRoutes from "./routes/usage.ts";
import pollinationsRoutes from './routes/apis/pollinations.ts';
import redditPostRoutes from './routes/redditPost.routes.ts';
import nodemailerRoutes from './routes/apis/nodemailer.ts';
import notificationRoutes from "./routes/notification.ts";
import { checkExpiringCoupons } from "./jobs/checkExpiringCoupons.ts";


const app = express();

// Trust proxy
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); 
} else {
  app.set('trust proxy', false);
}

// ============================================================
// ✅ CRITICAL: Security headers (NO body parsing)
// ============================================================
app.use(securityHeaders);

// ============================================================
// ✅ CRITICAL: Cookie parser (NO body parsing)
// ============================================================
app.use(cookieParser());

// ============================================================
// ✅ CRITICAL: CORS (NO body parsing)
// ============================================================
const allowedOrigins = [
  process.env.CLIENT_URL || "http://localhost:5173",
  "https://remotion-web-application.vercel.app",
  "http://localhost:5173",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-2FA-Verified", "X-Reauth-Token"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// ============================================================
// ✅ CRITICAL: WEBHOOK ROUTE MUST BE FIRST (before ANY body parsing)
// ============================================================
app.post(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

// ============================================================
// ⚠️ ALL BODY PARSING COMES AFTER WEBHOOK
// ============================================================

// ============================================================
// ✅ UPDATED: Conditional Rate Limiting (DISABLED in dev)
// ============================================================
if (process.env.NODE_ENV === 'production') {
  console.log('🛡️  Rate limiting ENABLED (production)');
  app.use(generalRateLimiter);
  app.use(speedLimiter);
} else {
  console.log('🔓 Rate limiting DISABLED (development)');
  // No rate limiting in development
}

// Body parser (comes AFTER webhook)
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, 
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ============================================================
// ✅ NEW: Analytics Rate Limiter (conditional)
// ============================================================
const analyticsRateLimiter = process.env.NODE_ENV === 'production'
  ? rateLimit({
      windowMs: 60 * 1000, // 1 minute
      max: 100, // 100 requests per minute in production
      skipSuccessfulRequests: false,
      skipFailedRequests: true,
      message: { 
        success: false, 
        error: "Analytics rate limit exceeded. Please try again in 1 minute." 
      },
      standardHeaders: true,
      legacyHeaders: false,
      validate: {
        trustProxy: false,
      },
    })
  : (req: any, res: any, next: any) => next(); // ✅ Skip entirely in dev

// Apply analytics rate limiter ONLY to analytics tracking endpoint
app.use("/admin/analytics/track", analyticsRateLimiter);

// ============================================================
// Register ALL other routes (AFTER body parsing)
// ============================================================
app.use("/api", airoutes);
app.use("/generatevideo", renderingroutes);
app.use("/uploadhandler", uploadroutes);
app.use("/useruploads", uploadindbroutes);
app.use("/sound", elevenlabsroutes);
app.use("/reddit", redditroute);
app.use("/auth", authroutes);
app.use("/projects", projectsroutes);
app.use("/pixabay", pixabayroutes);
app.use("/renders", rendersroutes);
app.use("/datasets", datasetsdbupload);
app.use("/fromuploadsdataset", getDatasetFronUploadsroute);
app.use("/authenticate", GoogleRoutes);
app.use("/api/picture", removeBgroutes);
app.use("/api/seedream", seeDreamRoutes);
app.use("/api/huggingFace", huggingFaceRoutes);
app.use("/api/gemini-image", geminiImageGenRoutes);
app.use("/api/openai-image", openAiImageGenRoutes);
app.use("/api/video-generation/huggingface", huggingFaceVideoGenroutes);
app.use("/api/video-generation/tavus", tavusRoutes);
app.use("/api/veo3", veoRoutes);
app.use("/api/youtube", ytRoutes);
app.use("/api/tools/audio", audioRoutes);
app.use("/api/tools/speech-enhancement", enhanceSpeechRoutes);
app.use("/api/veo3-video-generation", veo3Routes);
app.use("/api/youtube-v2", youtubeRoutes);
app.use('/api/tools/save-image', saveImageRoutes);
app.use("/api/image-generation", imageGenRoutes);
app.use("/api/subscription", subscriptionRoutes);
app.use("/admin", adminRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/prompt-improvement", promptImprovementRoutes);
app.use('/api/proxy', proxyRoutes);
app.use("/api/usage", usageRoutes);
app.use("/cloudinary", ssToCloudinaryRoutes);
app.use("/api/bunny", bunnyRoutes);
app.use("/api/pollinations", pollinationsRoutes);
app.use('/api/reddit-posts', redditPostRoutes);
app.use('/api/mail', nodemailerRoutes);
app.use("/api/notifications", notificationRoutes);

// ✅ Schedule expiry check daily at 9 AM
const scheduleExpiryCheck = () => {
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(9, 0, 0, 0);

  if (now > scheduledTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const timeUntilCheck = scheduledTime.getTime() - now.getTime();

  setTimeout(() => {
    checkExpiringCoupons();
    setInterval(checkExpiringCoupons, 24 * 60 * 60 * 1000);
  }, timeUntilCheck);

  console.log(`⏰ Expiry check scheduled for ${scheduledTime.toLocaleString()}`);
};

scheduleExpiryCheck();

// ✅ Run on startup in development
if (process.env.NODE_ENV !== 'production') {
  setTimeout(() => checkExpiringCoupons(), 5000);
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Global error:", err);
  
  const message = process.env.NODE_ENV === "production" 
    ? "Internal server error" 
    : err.message;

  res.status(err.status || 500).json({
    error: message,
    ...(process.env.NODE_ENV !== "production" && { stack: err.stack }),
  });
});

// Cleanup expired tokens every hour
setInterval(() => {
  cleanupExpiredTokens()
    .then(() => console.log("✅ Cleaned up expired tokens"))
    .catch((err) => console.error("❌ Token cleanup error:", err));
}, 60 * 60 * 1000);

// Cleanup on server shutdown
process.on("SIGTERM", () => {
  console.log("🛑 SIGTERM received, cleaning up...");
  cleanupExpiredTokens()
    .then(() => {
      console.log("✅ Cleanup complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error("❌ Cleanup error:", err);
      process.exit(1);
    });
});

const PORT = parseInt(process.env.PORT || "3000", 10);

app.listen(PORT, "0.0.0.0", () => {
  console.log("=================================");
  console.log(`✅ Server running on http://0.0.0.0:${PORT}`);
  console.log(`🔒 Security features enabled`);
  console.log(`🌐 CORS origins: ${allowedOrigins.join(", ")}`);
  
  if (process.env.NODE_ENV === 'production') {
    console.log(`🛡️  Rate limiting: ENABLED`);
    console.log(`📈 Analytics rate limit: 100 requests/minute`);
  } else {
    console.log(`🔓 Rate limiting: DISABLED (development)`);
    console.log(`📈 Analytics rate limit: DISABLED (development)`);
  }
  
  console.log(`🍪 Cookie support: Active`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🪝 Webhook endpoint: POST /api/subscription/webhook`);
  console.log("=================================");
});

export default app;