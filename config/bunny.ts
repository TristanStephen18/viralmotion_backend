
export const BUNNY_STORAGE_CONFIG = {
  apiKey: process.env.BUNNY_STORAGE_API_KEY || 'YOUR_STORAGE_API_KEY',
  storageZoneName: process.env.BUNNY_STORAGE_ZONE_NAME || 'YOUR_STORAGE_ZONE_NAME',
  storageEndpoint: process.env.BUNNY_STORAGE_ENDPOINT || 'storage.bunnycdn.com',
  pullZoneUrl: process.env.BUNNY_PULL_ZONE_URL || 'https://your-pullzone.b-cdn.net'
};

export const BUNNY_STREAM_CONFIG = {
  apiKey: process.env.BUNNY_STREAM_API_KEY || 'YOUR_STREAM_API_KEY',
  libraryId: process.env.BUNNY_STREAM_LIBRARY_ID || 'YOUR_LIBRARY_ID',
  cdnUrl: process.env.BUNNY_STREAM_CDN_URL || 'https://vz-xxxxx-xxx.b-cdn.net'
};