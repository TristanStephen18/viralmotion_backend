import multer from "multer";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as path from "path";

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "./server/public/images");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  },
});

const datasetsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "./server/public/datasets");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), "./server/public/datasets");
    let originalName = file.originalname;
    let filename = originalName;
    let filePath = path.join(uploadPath, filename);
    let counter = 2;
    // Check if file exists, if so, append (2), (3), etc.
    while (fs.existsSync(filePath)) {
      const ext = path.extname(originalName);
      const base = path.basename(originalName, ext);
      filename = `${base}(${counter})${ext}`;
      filePath = path.join(uploadPath, filename);
      counter++;
    }
    cb(null, filename);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const uploadDatasets = multer({
  storage: datasetsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/json",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JSON or XLSX files are allowed"));
    }
  },
});



const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(
      process.cwd(),
      "./server/public/videos/useruploads"
    );
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  },
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: {
    fileSize: 200 * 1024 * 1024,
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("video/")) {
      cb(null, true);
    } else {
      cb(new Error("Only video files are allowed"));
    }
  },
});

// 🔹 KenBurns storage
const kenBurnsStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(
      process.cwd(),
      "server/public/kenburnsuploads"
    );
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueId = uuidv4();
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueId}${extension}`);
  },
});

const uploadKenBurns = multer({
  storage: kenBurnsStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  },
});

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
  },
});

export { uploadVideo, upload, videoStorage, storage, uploadKenBurns, uploadDatasets, uploadMemory };
