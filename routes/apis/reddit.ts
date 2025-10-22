import { Router } from "express";

const router = Router();

router.post('/getpost', async (req, res)=>{
    console.log("🔍 Received Reddit fetch request");
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      return res.status(400).json({ error: "Missing url query param" });
    }

    const cleanUrl = url.split("?")[0];
    const jsonUrl = cleanUrl.endsWith(".json") ? cleanUrl : cleanUrl + ".json";

    console.log("Fetching Reddit JSON:", jsonUrl);
    const redditRes = await fetch(jsonUrl, {
      headers: { "User-Agent": "RedditVideoApp/1.0 by u/yourredditusername" },
    });
    console.log("Reddit status:", redditRes.status, redditRes.statusText);

    if (!redditRes.ok) {
      return res
        .status(redditRes.status)
        .json({ error: "Failed to fetch Reddit" });
    }

    console.log("Fetching Reddit data for URL:", url);

    const data = await redditRes.json();
    console.log("Fetched Reddit data for URL:", url);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error fetching Reddit" });
  }
})


export default router;