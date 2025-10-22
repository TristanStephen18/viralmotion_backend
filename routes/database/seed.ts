import { templatedata } from "../../data/templatesdata.ts";
import { db } from "../../db/client.ts";
import { templates } from "../../db/schema.ts";

async function seedTemplates() {
  await db.insert(templates).values(templatedata);
  console.log("✅ Templates seeded!");
}

seedTemplates()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
