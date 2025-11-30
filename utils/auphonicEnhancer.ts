import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import https from 'https';

export class AuphonicEnhancer {
  private apiToken: string;

  constructor() {
    this.apiToken = process.env.AUPHONIC_API_TOKEN || '';
    if (!this.apiToken) {
      throw new Error('AUPHONIC_API_TOKEN must be set in .env');
    }
    console.log('✅ Auphonic API token loaded');
  }

  private getHeaders() {
    return {
      'Authorization': `Bearer ${this.apiToken}`,
    };
  }

  async enhanceAudio(audioBuffer: Buffer, options: {
    denoiseLevel: number;
    enhanceClarity: boolean;
    removeEcho: boolean;
  }) {
    console.log('\n🎵 === Auphonic Enhancement Started ===');
    console.log('📊 Options:', options);

    try {
      // Step 1: Create production
      console.log('📋 Step 1: Creating production...');
      const production = await this.createProduction(options);
      console.log(`✅ Production created: ${production.uuid}`);

      // Step 2: Upload audio
      console.log('📤 Step 2: Uploading audio...');
      await this.uploadAudio(production.uuid, audioBuffer);
      console.log('✅ Upload complete');

      // Step 3: Start processing
      console.log('⚙️  Step 3: Starting enhancement...');
      await this.startProduction(production.uuid);
      console.log('✅ Enhancement started');

      // Step 4: Wait for completion
      console.log('⏳ Step 4: Waiting for completion...');
      const result = await this.waitForCompletion(production.uuid);
      console.log('✅ Enhancement complete!');

      // Step 5: Download enhanced audio (FIXED)
      console.log('📥 Step 5: Downloading enhanced audio...');
      
      if (!result.output_files || result.output_files.length === 0) {
        throw new Error('No output files found in production result');
      }

      const outputFile = result.output_files[0];
      console.log('📄 Output file:', outputFile.filename);
      console.log('🔗 Download URL:', outputFile.download_url);

      // Use axios instead of https for authenticated download
      const enhancedAudio = await this.downloadAudioWithAuth(production.uuid, outputFile.filename);
      console.log(`✅ Downloaded ${(enhancedAudio.length / 1024 / 1024).toFixed(2)} MB`);

      // Step 6: Save locally
      const filename = `enhanced-${Date.now()}.mp3`;
      const outputPath = path.join(process.cwd(), 'downloads', filename);
      const downloadsDir = path.join(process.cwd(), 'downloads');
      
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
      }

      fs.writeFileSync(outputPath, enhancedAudio);
      console.log('💾 Saved to:', outputPath);

      const localUrl = `http://localhost:3000/downloads/${filename}`;
      console.log('🎉 Success! URL:', localUrl);
      console.log('=== Enhancement Complete ===\n');

      return {
        audioUrl: localUrl,
        productionUuid: production.uuid,
        statistics: result.statistics,
      };
    } catch (error: any) {
      console.error('❌ Auphonic enhancement failed:', error.message);
      if (error.response?.data) {
        console.error('📋 API Error Details:', error.response.data);
      }
      throw error;
    }
  }

  private async createProduction(options: any) {
    const response = await axios.post(
      'https://auphonic.com/api/productions.json',
      {
        metadata: {
          title: `Enhanced Audio ${Date.now()}`,
        },
        algorithms: {
          denoise: options.denoiseLevel > 0,
          normloudness: options.enhanceClarity,
          filtering: options.removeEcho,
          hipfilter: true,
          leveler: true,
        },
        output_files: [
          {
            format: 'mp3',
            bitrate: 192,
            mono_mixdown: false,
          }
        ]
      },
      {
        headers: this.getHeaders(),
      }
    );

    return response.data.data;
  }

  private async uploadAudio(uuid: string, audioBuffer: Buffer) {
    const formData = new FormData();
    
    formData.append('input_file', audioBuffer, {
      filename: 'audio.mp3',
      contentType: 'audio/mpeg',
    });

    await axios.post(
      `https://auphonic.com/api/production/${uuid}/upload.json`,
      formData,
      {
        headers: {
          ...this.getHeaders(),
          ...formData.getHeaders(),
        },
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );
  }

  private async startProduction(uuid: string) {
    await axios.post(
      `https://auphonic.com/api/production/${uuid}/start.json`,
      {},
      {
        headers: this.getHeaders(),
      }
    );
  }

  private async waitForCompletion(uuid: string, maxAttempts = 60): Promise<any> {
    for (let i = 0; i < maxAttempts; i++) {
      const response = await axios.get(
        `https://auphonic.com/api/production/${uuid}.json`,
        {
          headers: this.getHeaders(),
        }
      );

      const status = response.data.data.status_string;
      const progress = response.data.data.status || 0;

      console.log(`   📊 Status: ${status} ${progress > 0 ? `(${progress}%)` : ''}`);

      if (status === 'Done') {
        return response.data.data;
      }

      if (status === 'Error') {
        const errorMsg = response.data.data.error_message || 'Unknown error';
        throw new Error(`Production failed: ${errorMsg}`);
      }

      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    throw new Error('Production timeout - took longer than 5 minutes');
  }

  // FIXED: Download with authentication using axios
  private async downloadAudioWithAuth(uuid: string, filename: string): Promise<Buffer> {
    try {
      // Method 1: Use the API endpoint for downloading
      const url = `https://auphonic.com/api/production/${uuid}/output_files/${filename}`;
      console.log('🔗 Downloading from:', url);

      const response = await axios.get(url, {
        headers: this.getHeaders(),
        responseType: 'arraybuffer',
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      return Buffer.from(response.data);
    } catch (error: any) {
      console.error('❌ Download failed with API endpoint, trying direct download...');
      
      // Method 2: Try getting the download URL with auth
      try {
        const prodResponse = await axios.get(
          `https://auphonic.com/api/production/${uuid}.json`,
          {
            headers: this.getHeaders(),
          }
        );

        const outputFile = prodResponse.data.data.output_files[0];
        const downloadUrl = outputFile.download_url;

        console.log('🔗 Trying direct download:', downloadUrl);

        const response = await axios.get(downloadUrl, {
          headers: this.getHeaders(),
          responseType: 'arraybuffer',
          maxContentLength: Infinity,
          maxBodyLength: Infinity,
        });

        return Buffer.from(response.data);
      } catch (innerError: any) {
        console.error('❌ Both download methods failed');
        throw new Error(`Failed to download audio: ${innerError.message}`);
      }
    }
  }

  // Keep the old method as backup (but it won't work without auth)
  private async downloadAudio(url: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      
      https.get(url, {
        headers: this.getHeaders(),
      }, (response) => {
        response.on('data', (chunk) => chunks.push(chunk));
        response.on('end', () => resolve(Buffer.concat(chunks)));
        response.on('error', reject);
      }).on('error', reject);
    });
  }
}