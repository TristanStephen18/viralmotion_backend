import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import session from "express-session";
import passport from "passport";

// Security middleware
import { generalRateLimiter, speedLimiter } from "./middleware/rateLimiter.ts";
import { securityHeaders } from "./middleware/securityHeaders.ts";
import { cleanupExpiredTokens } from "./utils/tokens.ts";

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
//screenshotsaver routes
import ssToCloudinaryRoutes from "./utils/screenshotSaver.ts";

const app = express();

// required for rate limiting and IP detection
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1); 
} else {
  app.set('trust proxy', false); // No proxy in development
}

// Security headers (XSS, clickjacking, MIME sniffing protection)
app.use(securityHeaders);

// Cookie parser for HTTP-only cookies
app.use(cookieParser());

// CORS configuration with credentials support
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
    credentials: true, // Allow cookies to be sent
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-2FA-Verified"],
    exposedHeaders: ["Set-Cookie"],
  })
);

// Rate limiting (general API protection)
app.use(generalRateLimiter);

// Speed limiting (progressive delays)
app.use(speedLimiter);

// Body parser
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Session configuration (for Google OAuth)
app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production", // HTTPS only in production
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, 
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

//  Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "healthy", 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Register routes
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

//new routes
app.use("/cloudinary", ssToCloudinaryRoutes);


app.use((req, res) => {
  res.status(404).json({ 
    error: "Route not found",
    path: req.path,
  });
});


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
}, 60 * 60 * 1000); // Every hour

//  Cleanup on server shutdown
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
  console.log(`🛡️  Rate limiting: Active`);
  console.log(`🍪 Cookie support: Active`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log("=================================");
});

export default app;