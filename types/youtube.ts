export interface YouTubeVideoInfo {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: string;
  likes: string;
  formats: Array<{
    quality: string;
    filesize: number;
    type: string;
  }>;
}

export interface YouTubeDownload {
  id: string;
  userId: number;
  videoId: string;
  videoUrl: string;
  title: string;
  thumbnail: string | null;
  duration: string | null;
  views: string | null;
  likes: string | null;
  quality: string;
  filesize: number | null;
  downloadedVideoUrl: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  errorMessage: string | null;
  metadata: Record<string, any> | null;
  createdAt: Date;
  completedAt: Date | null;
}

export interface YouTubeAPIResponse {
  success: boolean;
  video?: YouTubeVideoInfo;
  download?: YouTubeDownload;
  downloads?: YouTubeDownload[];
  downloadUrl?: string;
  error?: string;
  message?: string;
}