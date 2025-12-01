import express from "express";
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
import GoogleRoutes from './routes/google.ts';
import removeBgroutes from './routes/apis/removebg.ts';
import seeDreamRoutes from './routes/apis/seeDream.ts';
import huggingFaceRoutes from './routes/apis/huggingFace.ts';
import geminiImageGenRoutes from './routes/apis/imagegeneration/gemini.ts';
import openAiImageGenRoutes from './routes/apis/imagegeneration/openai.ts';
import huggingFaceVideoGenroutes from './routes/apis/videogeneration/huggingface.ts';
import tavusRoutes from './routes/apis/videogeneration/tavus.ts';
import googleStudioRoutes from './routes/apis/videogeneration/googlestudio.ts';
//renold additional routes
import veoRoutes from './routes/tools/veo.ts';
import ytRoutes from './routes/tools/yt_2.ts';
import audioRoutes from './routes/tools/audio.ts';
import enhanceSpeechRoutes from './routes/tools/enhanceSpeech.ts';
// import remixVideo from './routes/tools/remixVideo.ts';
// import mainRenderingRoute from ""

//additional veo3routes by laun
import veo3GenerationRoutes from './routes/veo3.ts';
import cors from "cors";
import session from 'express-session';
import passport from 'passport';

const app = express();
app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET || "supersecret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
// dotenv.config();
// const geminiapi = process.env.GEMINI_API_KEY!;

// ViteExpress.config({ viteConfigFile: "./frontend/vite.config.ts" });
app.set("trust proxy", true);

// app.use('/data', dataroutes);
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
app.use('/api/picture', removeBgroutes);
app.use('/api/seedream', seeDreamRoutes);
app.use('/api/huggingFace', huggingFaceRoutes);
app.use('/api/gemini-image', geminiImageGenRoutes);
app.use('/api/openai-image', openAiImageGenRoutes);
app.use('/api/video-generation/huggingface', huggingFaceVideoGenroutes);
app.use('/api/video-generation/tavus', tavusRoutes);
app.use('/api/veo', veoRoutes);
app.use('/api/youtube', ytRoutes);
app.use('/api/tools/audio',audioRoutes);
app.use('/api/tools/speech-enhancement', enhanceSpeechRoutes);
app.use('/api/video-generation/google', googleStudioRoutes);
app.use('/api/veo3-video-generation', veo3GenerationRoutes);

app.listen(3000, "0.0.0.0", () => {
  console.log("Server is running on http://0.0.0.0:3000");
});
