import { Request, Response } from 'express';
import { uploadBase64ToBunny, deleteBunnyFileByPath } from '../bunny/bunnyUploadController.ts';

export const uploadRedditPost = async (req: Request, res: Response) => {
  try {
    const { imageData, title } = req.body;

    if (!imageData || !title) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const uploadResult = await uploadBase64ToBunny(imageData, 'reddit-screenshots');
    
    if (!uploadResult.success) {
      return res.status(500).json({ success: false, error: uploadResult.error });
    }

    res.json({ 
      success: true, 
      data: {
        imageUrl: uploadResult.fileUrl,
        filePath: uploadResult.filePath,
        fileName: uploadResult.fileName,
      }
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

export const deleteRedditPost = async (req: Request, res: Response) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ success: false, error: 'File path required' });
    }

    const result = await deleteBunnyFileByPath(filePath);

    if (!result.success) {
      return res.status(500).json({ success: false, error: result.error });
    }

    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    console.error('❌ Delete error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};