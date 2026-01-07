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

// Add these at the end of your bunnyUploadController.ts
export const uploadBase64ToBunny = async (
  base64Data: string,
  folder: string = 'reddit-screenshots'
): Promise<{ success: boolean; fileUrl?: string; fileName?: string; filePath?: string; error?: string }> => {
  try {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const fileName = `reddit-${timestamp}-${random}.png`;
    const filePath = `${folder}/${fileName}`;
    
    const base64String = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const fileBuffer = Buffer.from(base64String, 'base64');
    
    // Simple: Just use the same format as your existing uploadFileToBunny function
    const uploadUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/${filePath}`;
    
    console.log('📤 Uploading to:', uploadUrl);
    
    const response = await axios.put(uploadUrl, fileBuffer, {
      headers: { 
        'AccessKey': BUNNY_STORAGE_CONFIG.apiKey, 
        'Content-Type': 'image/png' 
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    if (response.status === 201 || response.status === 200) {
      const fileUrl = `${BUNNY_STORAGE_CONFIG.pullZoneUrl}/${filePath}`;
      console.log('✅ Upload successful:', fileUrl);
      
      return {
        success: true,
        fileUrl,
        fileName,
        filePath,
      };
    }
    throw new Error('Upload failed');
  } catch (error: any) {
    console.error('❌ Upload error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.Message || error.message 
    };
  }
};

export const deleteBunnyFileByPath = async (filePath: string): Promise<{ success: boolean; error?: string }> => {
  try {
    // Simple: Just use the same format as your existing deleteFileFromBunny function
    const deleteUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/${filePath}`;
    
    console.log('🗑️  Deleting from:', deleteUrl);
    
    const response = await axios.delete(deleteUrl, {
      headers: { 'AccessKey': BUNNY_STORAGE_CONFIG.apiKey },
    });
    
    if (response.status === 200 || response.status === 204) {
      console.log('✅ Delete successful');
      return { success: true };
    }
    
    throw new Error('Delete failed');
  } catch (error: any) {
    console.error('❌ Delete error:', error.response?.data || error.message);
    return { 
      success: false, 
      error: error.response?.data?.Message || error.message 
    };
  }
};