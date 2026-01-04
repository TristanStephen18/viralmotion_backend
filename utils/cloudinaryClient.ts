
import { v2 as cloudinary } from "cloudinary";


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

console.log("✅ Cloudinary configured successfully");
console.log("==========================================");

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Upload image from file path
 */
export async function uploadImage(
  filePath: string,
  options?: {
    folder?: string;
    public_id?: string;
    transformation?: any;
  }
) {
  try {
    console.log(`[Cloudinary] Uploading image: ${filePath}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "image",
      folder: options?.folder || "images",
      public_id: options?.public_id,
      transformation: options?.transformation,
    });

    console.log(`[Cloudinary] ✅ Image uploaded: ${result.secure_url}`);
    return result;
  } catch (error: any) {
    console.error(`[Cloudinary] ❌ Image upload failed:`, error.message);
    throw error;
  }
}

/**
 * Upload image from base64 string
 */
export async function uploadImageFromBase64(
  base64String: string,
  options?: {
    folder?: string;
    public_id?: string;
    transformation?: any;
  }
) {
  try {
    console.log(`[Cloudinary] Uploading image from base64...`);
    
    const result = await cloudinary.uploader.upload(base64String, {
      resource_type: "image",
      folder: options?.folder || "images",
      public_id: options?.public_id,
      transformation: options?.transformation,
    });

    console.log(`[Cloudinary] ✅ Image uploaded: ${result.secure_url}`);
    return result;
  } catch (error: any) {
    console.error(`[Cloudinary] ❌ Image upload failed:`, error.message);
    throw error;
  }
}

/**
 * Upload image from buffer (for multer uploads)
 */
export async function uploadImageFromBuffer(
  buffer: Buffer,
  mimeType: string,
  options?: {
    folder?: string;
    public_id?: string;
    transformation?: any;
  }
) {
  try {
    console.log(`[Cloudinary] Uploading image from buffer (${mimeType})...`);
    
    const base64Image = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Image}`;
    
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: "image",
      folder: options?.folder || "images",
      public_id: options?.public_id,
      transformation: options?.transformation,
    });

    console.log(`[Cloudinary] ✅ Image uploaded: ${result.secure_url}`);
    return result;
  } catch (error: any) {
    console.error(`[Cloudinary] ❌ Image upload failed:`, error.message);
    throw error;
  }
}

/**
 * Upload video from file path
 */
export async function uploadVideo(
  filePath: string,
  options?: {
    folder?: string;
    public_id?: string;
  }
) {
  try {
    console.log(`[Cloudinary] Uploading video: ${filePath}`);
    
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: "video",
      folder: options?.folder || "videos",
      public_id: options?.public_id,
    });

    console.log(`[Cloudinary] ✅ Video uploaded: ${result.secure_url}`);
    return result;
  } catch (error: any) {
    console.error(`[Cloudinary] ❌ Video upload failed:`, error.message);
    throw error;
  }
}

/**
 * Upload audio from buffer (for multer uploads)
 */
export async function uploadAudioFromBuffer(
  buffer: Buffer,
  mimeType: string,
  options?: {
    folder?: string;
    public_id?: string;
    format?: string;
  }
) {
  try {
    console.log(`[Cloudinary] Uploading audio from buffer (${mimeType})...`);
    
    const base64Audio = buffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Audio}`;
    
    const result = await cloudinary.uploader.upload(dataUri, {
      resource_type: "video", // Cloudinary uses 'video' for audio files
      folder: options?.folder || "audio",
      public_id: options?.public_id,
      format: options?.format || "mp3",
      timeout: 60000, // 60 seconds timeout
    });

    console.log(`[Cloudinary] ✅ Audio uploaded: ${result.secure_url}`);
    return result;
  } catch (error: any) {
    console.error(`[Cloudinary] ❌ Audio upload failed:`, error.message);
    throw error;
  }
}

/**
 * Delete resource from Cloudinary
 */
export async function deleteResource(
  publicId: string,
  resourceType: "image" | "video" | "raw" = "image"
) {
  try {
    console.log(`[Cloudinary] Deleting ${resourceType}: ${publicId}`);
    
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
      invalidate: true, // Invalidate CDN cache
    });

    console.log(`[Cloudinary] ✅ Deleted: ${publicId}`, result);
    return result;
  } catch (error: any) {
    console.error(`[Cloudinary] ❌ Delete failed:`, error.message);
    throw error;
  }
}

/**
 * Generate thumbnail URL for video
 */
export function generateVideoThumbnail(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    startOffset?: string;
  }
) {
  return cloudinary.url(publicId, {
    resource_type: "video",
    format: "jpg",
    transformation: [
      {
        width: options?.width || 640,
        height: options?.height || 360,
        crop: "fill",
        start_offset: options?.startOffset || "1",
      },
    ],
  });
}

// ✅ Export the configured cloudinary instance for direct use
export default cloudinary;