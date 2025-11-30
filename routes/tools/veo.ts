import type{ Request, Response } from 'express';
import { Router } from 'express';

const router = Router();

// Generate VEO video endpoint
router.post('/generate-veo-video', async (req: Request, res: Response) => {
  try {
    const { prompt, duration, style, motionIntensity } = req.body;

    console.log('\n📥 Received VEO generation request:');
    console.log('   Body:', JSON.stringify(req.body, null, 2));

    if (!prompt) {
      console.error('❌ No prompt provided');
      return res.status(400).json({ error: 'Prompt is required' });
    }

    if (!process.env.GOOGLE_VEO_API_KEY) {
      console.error('❌ GOOGLE_VEO_API_KEY not configured');
      return res.status(500).json({ error: 'VEO API key not configured' });
    }

    // Construct enhanced prompt
    const enhancedPrompt = `${prompt}. Style: ${style}. Motion intensity: ${motionIntensity}/10. Duration: ${duration} seconds.`;

    console.log('🎬 Starting video generation...');
    console.log('   Prompt:', prompt);
    console.log('   Enhanced:', enhancedPrompt);

    // Try different API formats
    const endpoints = [
      {
        name: 'Imagen Video v1beta',
        url: `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict`,
        body: {
          instances: [
            {
              prompt: enhancedPrompt,
            }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
            negativePrompt: 'blurry, low quality, distorted',
          }
        }
      },
      {
        name: 'GenerateContent API',
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent`,
        body: {
          contents: [
            {
              parts: [
                {
                  text: `Generate a video: ${enhancedPrompt}`
                }
              ]
            }
          ]
        }
      },
      {
        name: 'Veo Direct',
        url: `https://generativelanguage.googleapis.com/v1beta/models/veo-001:generateContent`,
        body: {
          contents: [
            {
              parts: [
                {
                  text: enhancedPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.9,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }
      },
      {
        name: 'Imagen 2',
        url: `https://generativelanguage.googleapis.com/v1beta/models/imagegeneration@006:predict`,
        body: {
          instances: [
            {
              prompt: enhancedPrompt,
            }
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
          }
        }
      }
    ];

    let lastError = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`\n🔄 Trying: ${endpoint.name}`);
        console.log(`   URL: ${endpoint.url}`);
        
        const apiUrl = `${endpoint.url}?key=${process.env.GOOGLE_VEO_API_KEY}`;
        
        console.log('   Request body:', JSON.stringify(endpoint.body, null, 2));

        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(endpoint.body),
        });

        console.log('   Response status:', response.status);

        const responseText = await response.text();
        console.log('   Response preview:', responseText.substring(0, 500));

        if (response.status === 404) {
          console.log('   ⏭️  Endpoint not found, trying next...');
          lastError = { endpoint: endpoint.name, status: 404, message: 'Not Found' };
          continue;
        }

        if (!response.ok) {
          let errorData;
          try {
            errorData = JSON.parse(responseText);
            console.error('   ❌ Error:', JSON.stringify(errorData, null, 2));
            
            // Check if it's just wrong parameters
            if (errorData.error?.status === 'INVALID_ARGUMENT') {
              console.log('   ⚠️  Wrong parameters, trying next...');
              lastError = { endpoint: endpoint.name, status: response.status, error: errorData };
              continue;
            }
            
            lastError = { endpoint: endpoint.name, status: response.status, error: errorData };
            continue;
          } catch (e) {
            lastError = { endpoint: endpoint.name, status: response.status, error: responseText };
            continue;
          }
        }

        // Success!
        const data = JSON.parse(responseText);
        console.log('✅ Video generation started successfully!');
        console.log('   Endpoint used:', endpoint.name);
        console.log('   Full response:', JSON.stringify(data, null, 2));

        // Extract job ID from different response formats
        let jobId = data.name || data.operation?.name || data.id || 'unknown';
        
        console.log('   Job ID:', jobId);

        return res.json({
          jobId: jobId,
          status: 'processing',
          endpoint: endpoint.name,
          fullResponse: data,
        });

      } catch (error) {
        console.error('   ❌ Error with endpoint:', error);
        lastError = { endpoint: endpoint.name, error: error instanceof Error ? error.message : 'Unknown error' };
        continue;
      }
    }

    // If we get here, all endpoints failed
    console.error('❌ All endpoints failed');
    console.error('   Errors:', JSON.stringify(lastError, null, 2));
    
    return res.status(500).json({
      error: 'Video generation API is not available or not properly configured.',
      details: lastError,
      suggestion: 'VEO/Imagen Video might not be available for your API key. Please check:\n' +
        '1. Visit https://aistudio.google.com/ to verify access\n' +
        '2. VEO is currently in limited preview\n' +
        '3. You may need to request access or use a different API\n' +
        '4. Try using the test endpoint: /api/test-veo-models to see available models',
    });

  } catch (error) {
    console.error('❌ Video generation error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    });
  }
});

// Check status endpoint (works for any long-running operation)
router.get('/check-veo-status', async (req: Request, res: Response) => {
  try {
    const { jobId } = req.query;

    console.log('\n🔍 Checking job status...');
    console.log('   Job ID:', jobId);

    if (!jobId || typeof jobId !== 'string') {
      return res.status(400).json({ error: 'Valid jobId is required' });
    }

    if (!process.env.GOOGLE_VEO_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Try to get the operation status
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/${jobId}?key=${process.env.GOOGLE_VEO_API_KEY}`;

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('   Response status:', response.status);

    const responseText = await response.text();
    console.log('   Response preview:', responseText.substring(0, 300));

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }
      throw new Error(errorData.error?.message || 'Failed to check job status');
    }

    const data = JSON.parse(responseText);
    console.log('   Full response:', JSON.stringify(data, null, 2));

    // Check if operation is done
    if (data.done === true) {
      if (data.error) {
        console.error('❌ Job failed:', data.error);
        return res.status(500).json({ 
          error: data.error.message,
          status: 'failed' 
        });
      }

      console.log('✅ Job completed');
      
      // Extract video URL from different response formats
      const videoUrl = data.response?.videoUrl || 
                      data.response?.uri || 
                      data.response?.video?.uri ||
                      data.result?.videoUri ||
                      null;
      
      console.log('   Video URL:', videoUrl);
      
      return res.json({
        videoUrl: videoUrl,
        status: 'completed',
        fullResponse: data,
      });
    }

    // Still processing
    const progress = data.metadata?.progressPercent || 0;
    console.log(`⏳ Job in progress: ${progress}%`);
    
    res.json({
      status: 'processing',
      progress: progress,
    });
  } catch (error) {
    console.error('❌ Status check error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to check job status',
      status: 'error',
    });
  }
});

// Test endpoint - List available models
router.get('/test-veo-models', async (req: Request, res: Response) => {
  try {
    console.log('\n🧪 Listing available models...');
    
    if (!process.env.GOOGLE_VEO_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_VEO_API_KEY}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const responseText = await response.text();
    console.log('   Response status:', response.status);
    
    if (!response.ok) {
      return res.status(response.status).json({
        error: 'Failed to list models',
        response: responseText,
      });
    }

    const data = JSON.parse(responseText);
    
    // Show all models
    console.log('   Total models:', data.models?.length || 0);
    
    if (data.models) {
      console.log('\n   Available models:');
      data.models.forEach((model: any) => {
        console.log('   -', model.name, model.displayName ? `(${model.displayName})` : '');
        if (model.supportedGenerationMethods) {
          console.log('     Methods:', model.supportedGenerationMethods.join(', '));
        }
      });
    }

    res.json({
      totalModels: data.models?.length || 0,
      models: data.models,
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/check-job', async (req, res) => {
  const jobId = req.query.jobId;
  
  if (!jobId) {
    return res.status(400).json({ error: "Valid jobId is required" });
  }
  
  // ... rest of the logic remains the same
  
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/${jobId}?key=${process.env.GOOGLE_VEO_API_KEY}`,
      { method: "GET", headers: { "Content-Type": "application/json" } }
    );
    
    const data = await response.json();
    
    if (data.done) {
      return res.json({
        videoUrl: data.response?.videoUrl || data.response?.uri,
        status: "completed",
      });
    }
    
    return res.json({
      status: "processing",
      progress: data.metadata?.progressPercent || 0,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check job status" });
  }
});

export default router;