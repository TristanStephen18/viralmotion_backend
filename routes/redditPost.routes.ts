// src/routes/redditPost.routes.ts
import express from 'express';
import type { Request, Response } from 'express';  // ← Changed this line
import axios from 'axios';
import { BUNNY_STORAGE_CONFIG } from '../config/bunny.ts';  // ← Removed .ts

const router = express.Router();

// Upload Reddit screenshot to Bunny
router.post('/upload', async (req: Request, res: Response) => {
  console.log('🎯 Reddit upload endpoint hit!');
  console.log('📦 Request body keys:', Object.keys(req.body));
  
  try {
    const { imageData, title } = req.body;

    if (!imageData || !title) {
      console.log('❌ Missing fields - imageData:', !!imageData, 'title:', !!title);
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    console.log('✅ Has imageData and title');
    console.log('📏 ImageData length:', imageData.length);

    // Generate unique filename
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const fileName = `reddit-${timestamp}-${random}.png`;
    const filePath = `reddit-screenshots/${fileName}`;
    
    console.log('📝 Generated filename:', fileName);
    
    // Convert base64 to buffer
    const base64String = imageData.includes(',') ? imageData.split(',')[1] : imageData;
    const fileBuffer = Buffer.from(base64String, 'base64');
    
    console.log('🔄 Converted to buffer, size:', fileBuffer.length, 'bytes');
    
    // Check Bunny config
    console.log('🐰 Bunny Config:');
    console.log('  - Endpoint:', BUNNY_STORAGE_CONFIG.storageEndpoint);
    console.log('  - Zone:', BUNNY_STORAGE_CONFIG.storageZoneName);
    console.log('  - Has API Key:', !!BUNNY_STORAGE_CONFIG.apiKey);
    console.log('  - Pull Zone:', BUNNY_STORAGE_CONFIG.pullZoneUrl);
    
    // Upload to Bunny
    const uploadUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/${filePath}`;
    
    console.log('📤 Upload URL:', uploadUrl);
    
    const response = await axios.put(uploadUrl, fileBuffer, {
      headers: { 
        'AccessKey': BUNNY_STORAGE_CONFIG.apiKey, 
        'Content-Type': 'image/png' 
      },
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    
    console.log('📡 Bunny response status:', response.status);
    
    if (response.status === 201 || response.status === 200) {
      const pullZoneUrl = BUNNY_STORAGE_CONFIG.pullZoneUrl.startsWith('http') 
        ? BUNNY_STORAGE_CONFIG.pullZoneUrl 
        : `https://${BUNNY_STORAGE_CONFIG.pullZoneUrl}`;
        const fileUrl = `${pullZoneUrl}/${filePath}`;
      
      console.log('✅ Upload successful!');
      console.log('🌐 File URL:', fileUrl);
      
      res.json({ 
        success: true, 
        data: { 
          imageUrl: fileUrl, 
          filePath, 
          fileName 
        }
      });
    } else {
      throw new Error('Upload failed');
    }
  } catch (error: any) {
    console.error('❌ Upload error:', error.response?.data || error.message);
    console.error('❌ Full error:', error);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.Message || error.message 
    });
  }
});

router.delete('/delete', async (req: Request, res: Response) => {
  console.log('🗑️ Delete endpoint hit!');
  
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path required' });
    }

    console.log('🗑️ Deleting:', filePath);

    const deleteUrl = `https://${BUNNY_STORAGE_CONFIG.storageEndpoint}/${BUNNY_STORAGE_CONFIG.storageZoneName}/${filePath}`;
    
    console.log('🗑️ Delete URL:', deleteUrl);
    
    const response = await axios.delete(deleteUrl, {
      headers: { 'AccessKey': BUNNY_STORAGE_CONFIG.apiKey },
    });
    
    console.log('📡 Delete response status:', response.status);
    
    if (response.status === 200 || response.status === 204) {
      console.log('✅ Delete successful');
      res.json({ success: true, message: 'Deleted' });
    } else {
      throw new Error('Delete failed');
    }
  } catch (error: any) {
    console.error('❌ Delete error:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      error: error.response?.data?.Message || error.message 
    });
  }
});

export default router;