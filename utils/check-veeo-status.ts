// import express from 'express';

// const router = express.Router();

// router.get('/check-job', async (req, res) => {
//   const jobId = req.query.jobId;
  
//   if (!jobId) {
//     return res.status(400).json({ error: "Valid jobId is required" });
//   }
  
//   // ... rest of the logic remains the same
  
//   try {
//     const response = await fetch(
//       `https://generativelanguage.googleapis.com/v1beta/${jobId}?key=${process.env.GOOGLE_VEO_API_KEY}`,
//       { method: "GET", headers: { "Content-Type": "application/json" } }
//     );
    
//     const data = await response.json();
    
//     if (data.done) {
//       return res.json({
//         videoUrl: data.response?.videoUrl || data.response?.uri,
//         status: "completed",
//       });
//     }
    
//     return res.json({
//       status: "processing",
//       progress: data.metadata?.progressPercent || 0,
//     });
//   } catch (error) {
//     res.status(500).json({ error: "Failed to check job status" });
//   }
// });