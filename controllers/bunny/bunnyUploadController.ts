// controllers/bunnyUploadController.ts
import type { Request, Response } from 'express';
import axios from 'axios';
import FormData from 'form-data';
import { BUNNY_STORAGE_CONFIG } from '../../config/bunny.ts';

export const uploadFileToBunny = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { originalname, buffer, mimetype } = req.file;
    
    // Create a unique filename (optional: add timestamp or UUID)
    const timestamp = Date.now();
    const filename = `${timestamp}-${originalname}`;

    // Upload to Bunny Storage
    const uploadUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/${filename}`;

    const response = await axios.put(uploadUrl, buffer, {
      headers: {
        'AccessKey': BUNNY_STORAGE_CONFIG.apiKey,
        'Content-Type': mimetype,
      },
    });

    if (response.status === 201) {
      const fileUrl = `https://${BUNNY_STORAGE_CONFIG.pullZoneUrl}/${filename}`;
      
      return res.status(200).json({
        success: true,
        message: 'File uploaded successfully',
        file: {
          name: filename,
          originalName: originalname,
          url: fileUrl,
          size: buffer.length,
          mimetype: mimetype,
        },
      });
    } else {
      return res.status(response.status).json({
        error: 'Upload failed',
        details: response.data,
      });
    }
  } catch (error: any) {
    console.error('Bunny upload error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to upload file',
      details: error.response?.data || error.message,
    });
  }
};

export const deleteFileFromBunny = async (req: Request, res: Response) => {
  try {
    const { filename } = req.params;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    const deleteUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/${filename}`;

    const response = await axios.delete(deleteUrl, {
      headers: {
        'AccessKey': BUNNY_STORAGE_CONFIG.apiKey,
      },
    });

    if (response.status === 200) {
      return res.status(200).json({
        success: true,
        message: 'File deleted successfully',
      });
    } else {
      return res.status(response.status).json({
        error: 'Delete failed',
        details: response.data,
      });
    }
  } catch (error: any) {
    console.error('Bunny delete error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to delete file',
      details: error.response?.data || error.message,
    });
  }
};

export const listFilesFromBunny = async (req: Request, res: Response) => {
  try {
    const listUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/`;

    const response = await axios.get(listUrl, {
      headers: {
        'AccessKey': BUNNY_STORAGE_CONFIG.apiKey,
      },
    });

    return res.status(200).json({
      success: true,
      files: response.data,
    });
  } catch (error: any) {
    console.error('Bunny list error:', error.response?.data || error.message);
    return res.status(500).json({
      error: 'Failed to list files',
      details: error.response?.data || error.message,
    });
  }
};