
import axios from "axios";

const API_KEY = process.env.HUGGINGFACE_API_KEY;
const BASE_URL = "https://api-inference.huggingface.co/models";

const modelsToTest = [
  "black-forest-labs/FLUX.1-dev",
  "stabilityai/stable-diffusion-xl-base-1.0",
  "stabilityai/stable-diffusion-2-1",
  "runwayml/stable-diffusion-v1-5",
  "CompVis/stable-diffusion-v1-4",
  "prompthero/openjourney-v4",
];

async function testModel(modelName: string) {
  console.log(`\n🧪 Testing: ${modelName}`);
  console.log("=".repeat(60));

  try {
    const response = await axios.post(
      `${BASE_URL}/${modelName}`,
      {
        inputs: "a simple test image",
        options: {
          wait_for_model: true,
          use_cache: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
        responseType: "arraybuffer",
        validateStatus: () => true, // Don't throw on any status
      }
    );

    if (response.status === 200) {
      console.log("✅ SUCCESS - Model is working!");
      return { model: modelName, status: "working", code: 200 };
    } else if (response.status === 503) {
      const errorText = Buffer.from(response.data).toString();
      const errorJson = JSON.parse(errorText);
      
      if (errorJson.error?.includes("loading")) {
        console.log("⏳ LOADING - Model is available but loading");
        console.log(`   Estimated time: ${errorJson.estimated_time}s`);
        return { model: modelName, status: "loading", code: 503 };
      }
    } else if (response.status === 410) {
      const errorText = Buffer.from(response.data).toString();
      console.log("❌ DEPRECATED - Model no longer available (410)");
      console.log(`   Error: ${errorText.substring(0, 100)}...`);
      return { model: modelName, status: "deprecated", code: 410 };
    } else if (response.status === 404) {
      console.log("❌ NOT FOUND - Model doesn't exist (404)");
      return { model: modelName, status: "not_found", code: 404 };
    } else {
      console.log(`⚠️  UNKNOWN STATUS - ${response.status}`);
      return { model: modelName, status: "unknown", code: response.status };
    }
  } catch (error: any) {
    console.log("❌ ERROR:", error.message);
    return { model: modelName, status: "error", error: error.message };
  }

  return { model: modelName, status: "unknown" };
}

async function main() {
  if (!API_KEY) {
    console.error("❌ HUGGINGFACE_API_KEY not set in environment!");
    console.error("Set it with: export HUGGINGFACE_API_KEY=your_key_here");
    process.exit(1);
  }

  console.log("🚀 Testing Hugging Face Models...");
  console.log(`Using API key: ${API_KEY.substring(0, 10)}...`);

  const results = [];

  for (const model of modelsToTest) {
    const result = await testModel(model);
    results.push(result);
    await new Promise((resolve) => setTimeout(resolve, 2000)); // Wait 2s between tests
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 SUMMARY");
  console.log("=".repeat(60));

  const working = results.filter((r) => r.status === "working");
  const loading = results.filter((r) => r.status === "loading");
  const deprecated = results.filter((r) => r.status === "deprecated");
  const notFound = results.filter((r) => r.status === "not_found");

  console.log(`\n✅ Working models (${working.length}):`);
  working.forEach((r) => console.log(`   - ${r.model}`));

  console.log(`\n⏳ Available but loading (${loading.length}):`);
  loading.forEach((r) => console.log(`   - ${r.model}`));

  console.log(`\n❌ Deprecated/Gone (${deprecated.length}):`);
  deprecated.forEach((r) => console.log(`   - ${r.model}`));

  console.log(`\n❌ Not found (${notFound.length}):`);
  notFound.forEach((r) => console.log(`   - ${r.model}`));

  console.log("\n💡 RECOMMENDATION:");
  if (working.length > 0 || loading.length > 0) {
    console.log(
      `Use: ${working[0]?.model || loading[0]?.model || "stabilityai/stable-diffusion-xl-base-1.0"}`
    );
  } else {
    console.log("⚠️  No models working on free tier!");
    console.log("Consider using Pollinations instead (free, no API key needed)");
  }

  console.log("\n" + "=".repeat(60));
}

main().catch(console.error);