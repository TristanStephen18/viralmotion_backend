// routes/bunnyUpload.routes.ts
import express from 'express';
import multer from 'multer';
import {
  uploadFileToBunny,
  deleteFileFromBunny,
  listFilesFromBunny,
} from '../../controllers/bunny/bunnyUploadController.ts';

const router = express.Router();

// Configure multer to store files in memory
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Optional: Add file type restrictions
    // const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'];
    // if (allowedTypes.includes(file.mimetype)) {
    //   cb(null, true);
    // } else {
    //   cb(new Error('Invalid file type'));
    // }
    cb(null, true);
  },
});

// Upload file
router.post('/upload', upload.single('file'), uploadFileToBunny);

// Delete file
router.delete('/delete/:filename', deleteFileFromBunny);

// List all files
router.get('/list', listFilesFromBunny);

export default router;