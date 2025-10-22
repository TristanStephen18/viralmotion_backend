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
import cors from "cors";
import fs from "fs";
import { distentry, entry, entry2 } from "./controllers/entrypoint.ts";

const app = express();
app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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

app.listen(3000, "0.0.0.0", () => {
  // console.log(__dirname);
  // console.log(geminiapi);
  // console.log(path.join(process.cwd(),"./server/public/datasets"));
  fs.existsSync(entry);
  fs.existsSync(entry2);
  fs.existsSync(distentry);

  console.log("Server is running on http://0.0.0.0:3000");
});
