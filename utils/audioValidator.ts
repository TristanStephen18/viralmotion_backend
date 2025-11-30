export class AudioValidator {
  private static readonly MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
  private static readonly ALLOWED_MIMETYPES = [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp4',
    'audio/m4a',
    'audio/ogg',
    'audio/webm',
  ];

  static validateFile(file: Express.Multer.File): { valid: boolean; error?: string } {
    // Check if file exists
    if (!file) {
      return {
        valid: false,
        error: 'No file provided',
      };
    }

    // Check file size
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `File size exceeds ${this.MAX_FILE_SIZE / 1024 / 1024}MB limit`,
      };
    }

    // Check file type
    if (!this.ALLOWED_MIMETYPES.includes(file.mimetype)) {
      return {
        valid: false,
        error: `Invalid file type: ${file.mimetype}. Allowed types: ${this.ALLOWED_MIMETYPES.join(', ')}`,
      };
    }

    // Check if file buffer exists
    if (!file.buffer || file.buffer.length === 0) {
      return {
        valid: false,
        error: 'File appears to be empty or corrupted',
      };
    }

    return { valid: true };
  }

  static isAudioFile(mimetype: string): boolean {
    return this.ALLOWED_MIMETYPES.includes(mimetype);
  }
}