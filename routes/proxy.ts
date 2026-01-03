import express from 'express';
import type { Request, Response } from 'express';

const router = express.Router();

// ============================================
// GET API KEYS FROM ENVIRONMENT VARIABLES
// These are loaded from your .env file
// ============================================
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const GIPHY_API_KEY = process.env.GIPHY_API_KEY;
const FREESOUND_API_KEY = process.env.FREESOUND_API_KEY;

// ============================================
// PEXELS PHOTOS PROXY
// Frontend calls: /api/proxy/pexels/photos?query=nature&per_page=30
// This proxies to: https://api.pexels.com/v1/search?query=nature&per_page=30
// ============================================
router.get('/pexels/photos', async (req: Request, res: Response) => {
  // Extract query parameters from the frontend request
  const { query, per_page = '30' } = req.query;

  try {
    // Build the Pexels API URL
    // If query exists, search for photos
    // If no query, get curated (popular) photos
    let endpoint: string;
    
    if (query && String(query).trim() !== '') {
      // Search endpoint
      endpoint = `https://api.pexels.com/v1/search?query=${encodeURIComponent(String(query))}&per_page=${per_page}`;
    } else {
      // Curated/trending endpoint
      endpoint = `https://api.pexels.com/v1/curated?per_page=${per_page}`;
    }

    console.log('📸 Pexels Photos Proxy:', endpoint);

    // Make the request to Pexels API
    // The Authorization header contains your API key
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': PEXELS_API_KEY as string,
        'Content-Type': 'application/json',
      },
    });

    // Check if the response is OK
    if (!response.ok) {
      console.error('❌ Pexels API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Pexels API error', 
        status: response.status 
      });
    }

    // Parse the JSON response
    const data = await response.json();
    
    console.log('✅ Pexels Photos: Found', data.photos?.length || 0, 'photos');

    // Send the data back to the frontend
    res.json(data);

  } catch (error) {
    console.error('❌ Pexels photos proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from Pexels',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// PEXELS VIDEOS PROXY
// Frontend calls: /api/proxy/pexels/videos?query=nature&per_page=30
// This proxies to: https://api.pexels.com/videos/search?query=nature&per_page=30
// ============================================
router.get('/pexels/videos', async (req: Request, res: Response) => {
  const { query, per_page = '30' } = req.query;

  try {
    let endpoint: string;
    
    if (query && String(query).trim() !== '') {
      // Search videos endpoint
      endpoint = `https://api.pexels.com/videos/search?query=${encodeURIComponent(String(query))}&per_page=${per_page}`;
    } else {
      // Popular videos endpoint
      endpoint = `https://api.pexels.com/videos/popular?per_page=${per_page}`;
    }

    console.log('🎬 Pexels Videos Proxy:', endpoint);

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': PEXELS_API_KEY as string,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Pexels Videos API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Pexels API error', 
        status: response.status 
      });
    }

    const data = await response.json();
    
    console.log('✅ Pexels Videos: Found', data.videos?.length || 0, 'videos');

    res.json(data);

  } catch (error) {
    console.error('❌ Pexels videos proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch videos from Pexels',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// GIPHY PROXY
// Frontend calls: /api/proxy/giphy/search?query=funny&limit=20
// This proxies to: https://api.giphy.com/v1/gifs/search?api_key=...&q=funny&limit=20
// ============================================
router.get('/giphy/search', async (req: Request, res: Response) => {
  const { query, limit = '20' } = req.query;

  try {
    let endpoint: string;
    
    if (query && String(query).trim() !== '') {
      // Search GIFs endpoint
      endpoint = `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(String(query))}&limit=${limit}&rating=g`;
    } else {
      // Trending GIFs endpoint
      endpoint = `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=${limit}&rating=g`;
    }

    console.log('🎭 Giphy Proxy:', endpoint.replace(GIPHY_API_KEY as string, '***'));

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Giphy API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Giphy API error', 
        status: response.status 
      });
    }

    const data = await response.json();
    
    console.log('✅ Giphy: Found', data.data?.length || 0, 'GIFs');

    res.json(data);

  } catch (error) {
    console.error('❌ Giphy proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from Giphy',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// FREESOUND PROXY (for Music)
// Frontend calls: /api/proxy/freesound/search?query=ambient&page_size=20
// This proxies to: https://freesound.org/apiv2/search/text/?query=ambient&token=...
// ============================================
router.get('/freesound/search', async (req: Request, res: Response) => {
  const { query = 'ambient', page_size = '20' } = req.query;

  try {
    // Freesound API endpoint
    // fields= specifies what data to return for each sound
    const endpoint = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(String(query))}&fields=id,name,duration,previews,username,tags&page_size=${page_size}&token=${FREESOUND_API_KEY}`;

    console.log('🎵 Freesound Proxy:', endpoint.replace(FREESOUND_API_KEY as string, '***'));

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Freesound API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Freesound API error', 
        status: response.status 
      });
    }

    const data = await response.json();
    
    console.log('✅ Freesound: Found', data.results?.length || 0, 'sounds');

    res.json(data);

  } catch (error) {
    console.error('❌ Freesound proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch from Freesound',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================
// FREESOUND SFX PROXY (same as music, different default query)
// Frontend calls: /api/proxy/freesound/sfx?query=whoosh&page_size=20
// ============================================
router.get('/freesound/sfx', async (req: Request, res: Response) => {
  const { query = 'sound effect', page_size = '20' } = req.query;

  try {
    const endpoint = `https://freesound.org/apiv2/search/text/?query=${encodeURIComponent(String(query))}&fields=id,name,duration,previews,username,tags&page_size=${page_size}&token=${FREESOUND_API_KEY}`;

    console.log('🔊 Freesound SFX Proxy:', endpoint.replace(FREESOUND_API_KEY as string, '***'));

    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ Freesound SFX API error:', response.status, response.statusText);
      return res.status(response.status).json({ 
        error: 'Freesound API error', 
        status: response.status 
      });
    }

    const data = await response.json();
    
    console.log('✅ Freesound SFX: Found', data.results?.length || 0, 'sounds');

    res.json(data);

  } catch (error) {
    console.error('❌ Freesound SFX proxy error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch SFX from Freesound',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;