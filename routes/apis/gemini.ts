import { Router } from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import {
  BarGraphDataSchema,
  CurveLineTrendSchema,
  FactCardsTemplateDatasetSchema,
  KpiFlipCardsDatasetSchema,
  QuoteDataPropsSchema,
  SingleOutputQuoteSpotlightSchema,
  TextTypingTemplatePhraseSchema,
  TextTypingTemplateSchema,
} from "../../models/gemini_schemas.ts";
import { serverImages } from "../../data/localimages.ts";
import {
  CategoryOptions,
  MoodOptions,
} from "../../data/texttyping_moods_categories.ts";
import { curveLineDataTypes } from "../../data/curvelinetrendsymbols.ts";
import { fonts, fontValues } from "../../data/fonst.ts";
import { schemaIdentifier } from "../../utils/schemaidentifier.ts";
import { templatedata } from "../../data/templatesdata.ts";

dotenv.config();

const router = Router();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY_2!);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

router.get("/reddit", async (req, res) => {
  //   const { niche, template } = req.body;
  // console.log(process.env.GEMINI_API_KEY!);
  const prompt = `Can you fetch a random reddit post? And respond only with the url`;

  try {
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    res.send({ message: result.response.text() });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating content. Please try again." });
  }
});

router.post("/generate-textcontent", async (req, res) => {
  const { prompt } = req.body;

  var newprompt = prompt;
  if (!prompt || prompt === "") {
    newprompt = "Create a simple poem";
  }
  try {
    const result = await model.generateContent(newprompt);
    console.log(result.response.text());
    res.json({ textcontent: result.response.text() });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating content. Please try again." });
  }
});

router.post("/generate-quote", async (req, res) => {
  const prompt = `Suggest a quote by an author. Respond only with the quote and the author nothing else. They should be separated by a dash. Example: Some Quote - Author. Exactly like that nothing else more, don't put the quote in quotation marks, dont add a line before the name of the author, just the quote and author separated by a dash.`;

  try {
    const result = await model.generateContent(prompt);
    console.log(result.response.text());
    const data = result.response.text().split(" - ");
    const quote = data[0];
    const author = data[1].replaceAll("\n", "");
    res.json({ quote: quote, author: author });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Error creating content. Please try again." });
  }
});

router.post("/generate-story", async (req, res) => {
  const { prompt, genres } = req.body;

  let newprompt = "";

  if (prompt && genres) {
    newprompt = `${prompt}. Genres: ${genres}`;
  } else if (prompt && !genres) {
    newprompt = prompt;
  } else if (!prompt && genres) {
    newprompt = `Create a story using the following genres: ${genres}`;
  }

  try {
    const result = await model.generateContent(newprompt);
    const text = result.response.text();
    console.log(text);
    res.json({ story: text });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating story. Please try again." });
  }
});

router.post("/generate-phrase", async (req, res) => {
  const { category, mood } = req.body;

  // const newprompt = `Generate a phrase using the category ${category} and mood ${mood}. This will be in a template so you have to use '\n' to break the phrase when you think it is better to have it in a new line. The maximum characters per line should be 13, spaces will count as a character. And just the phrase,no addition '', "", ' signs.`;

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a phrase using the category ${category} and mood ${mood}.Break the lines of the phrases where you want to to make the array of lines. Try not to make each line too long,just make it sufficient and proper like this "Dream big, start small".`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: TextTypingTemplatePhraseSchema,
      },
    });
    const text = result.response.text();
    const data = JSON.parse(text);
    console.log(text);
    res.json({ phrase: data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating story. Please try again." });
  }
});

router.post("/batch-quotejson-trial", async (req, res) => {
  const { quantity } = req.body;
  console.log("Generating datasets");

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} random quotes from philosophers, actors, teachers, from anyone, with author.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: QuoteDataPropsSchema,
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);

    console.log(data);
    res.json({ phrase: data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating story. Please try again." });
  }
});

router.post("/generate/texttypingdataset", async (req, res) => {
  const { quantity } = req.body;
  console.log("Generating datasets for texttyping template");

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} random short phrases, with mood and category. Break the lines of the phrases where you want to to make the array of lines. Try not to make each line too long,just make it sufficient and proper like this "Dream big, start small". 
              Choose only from this moods ${MoodOptions} and categories ${CategoryOptions}. Use this as your basis for the line breaks in the lines array "lines": [
      "Dream big, start small",
      "but start today"
    ]`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: TextTypingTemplateSchema,
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);

    console.log(data);
    res.json({ phrase: data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating story. Please try again." });
  }
});

router.post("/generate/bargraphdataset", async (req, res) => {
  const { quantity } = req.body;
  const sampledata = {
    name: "Milkshake",
    value: 10002,
  };
  console.log("Generating datasets for bargraph template");

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} datasets that has a title, subtitle and the data. The title should be an analytics title, and the subtitle will support the title as if completing the whole header like, title: "Top Selling Items for Mcdo", subtitle: "For the month of March 2025" but don't use this as the first one okay? This is just an example. For the data, is it an array of ${sampledata}. The name should be acquinted with the title and so as the value. The maximum number of items in the data array is 8 and a minimum of 6.The difference between the values should not be wide, meaning if one value is 1092, the other ones should be 2001, 3100,1892 something like this, because if the gap is so wide the value will not be visible in the bargraph okay? Those values are just examples don't make them the basis of min and max values. You can create your own just don't make the gap between the values too wide.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: BarGraphDataSchema,
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);

    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating story. Please try again." });
  }
});

router.post("/generate/curvelinedataset", async (req, res) => {
  const { quantity } = req.body;
  const sampledata = {
    label: 2025,
    value: 10002,
  };
  console.log("Generating datasets for curveline template");

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} datasets that has a title, subtitle, dataType and the data. The title should be an analytics title, and the subtitle will support the title as if completing the whole header like, title: "Revenue Growth", subtitle: "2015–2024 • Journey" but don't use this as the first one okay? This is just an example. For the dataType, choose from this ${curveLineDataTypes}. For the data, is it an array of ${sampledata}. The label should be a year (it is not limited to the 20th century, it can be from the 90s or lower) that keeps progressing and the value is up to you, you just have to show the value over the progressing years supporting the analytics. The maximum number of items in the data array is 20 and a minimum of 10.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: CurveLineTrendSchema,
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);

    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating story. Please try again." });
  }
});

router.post("/generate/factcardsdataset", async (req, res) => {
  const { quantity, niches } = req.body;

  console.log("Generating datasets for fact cards template", quantity);

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} datasets for the niches selected ${niches}. 
              The dataset shall include a introductory title with a subtitle to follow up the title. And an outro title and subtitle that you will find most fitting, 
              it could be a learn more type outro or a description type, it is up to you but keep it minimal. For the array of facts, it should be according to the niches, 
              the title for the facts should be more or less miminal it should hook the viewers attention to it and the description should be truthful and short. `,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: FactCardsTemplateDatasetSchema,
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);

    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating story. Please try again." });
  }
});

router.post("/generate/kpiflipcardsdataset", async (req, res) => {
  const { quantity } = req.body;

  console.log("Generating datasets for kpiflip cards template");

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate ${quantity} of datasets for a kpiflip cad remotion template. It should have a title (short but complete in thought), a subtitle to support the title. 
              This template is an metric/measurement based template to it the title and subtitle should be based on that too. The cardsData length should be maximum of 8 and minimum of 4. 
              The value of the cards data are different metrics, no repetitions and the color should not be light. 
              As for the vaueFontSize it should depend on the value size if the value.length is longer than 7 make the valuefontsize between 40-45,but if not make it 46-48, cardlabelfontsize should be between 28 and 32. 
              For the cardcolors both back and front, it should highlight the value 
              and label meaning the colors of the card should not be contradicting wth the colors of the value and the label. 
              The cardBorder color should not be the same with the cardColorFront and back because it will not be seen.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: KpiFlipCardsDatasetSchema,
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);

    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating story. Please try again." });
  }
});

//ai setup routes

router.post("/setup/quotetemplate", async (req, res) => {
  const { preferences } = req.body;
  console.log("Generating ai setup data for quote template");

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Generate a dataset that has a quote, author, backgroundImage url, fontColor and fontfamily using this ${preferences} preferences from the user. The quotes and authors must depend on the chosen preferences, there shall be no repeated quotes. Choose from this images for the backgroundImage ${serverImages}(choose randomly) and the fontFamily will be from this array of fonts ${fontValues}(it will be depending on the preferences also) but choose the whole string value not just the fontfamily from the string okay?In the fontfamily don'tbe fixated on Arial and playfair display there are many fonts available. You can decide the fontcolor depending on the user preferences, but it must be light colors, like white, yellow, yellowgreen, pink, skyblue, and more, not dark colors.`,
            },
          ],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: SingleOutputQuoteSpotlightSchema,
      },
    });

    const text = result.response.text();
    const data = JSON.parse(text);

    console.log(data);
    res.json({ data });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ textcontent: "Error creating story. Please try again." });
  }
});

//datasetformatter function
export async function datasetFormatterUsingAi(
  template: string,
  type: string,
  extracteddata: any
) {
  console.log(
    "formatting given data for file type: ",
    type,
    "template: ",
    template
  );

  const formattedInput = JSON.stringify(extracteddata, null, 2);
  const formattedSchema = JSON.stringify(schemaIdentifier(template), null, 2);
  let extraRule = "";
  if (template === "texttyping") {
    extraRule = `11. For texttyping templates, choose only from these moods: ${MoodOptions} and categories: ${CategoryOptions}.\n`;
  } else if (template === "curvelinetrend") {
    extraRule = `11. For curvelinetrend template, for the dataType, choose from this ${curveLineDataTypes}`;
  }
  let prompt =
    "You are a strict data formatter. You must strictly follow the provided JSON schema structure and types. Do not deviate from the schema in any way. Before responding, carefully and thoroughly read and analyze BOTH the input data and the schema provided below. Your job is to convert the following dataset to match the schema, using ONLY the values from the input data. Do not invent, change, or ignore any values. If you cannot use the input data as-is, return an error message instead of generating new data.\n" +
    "\nRules:\n" +
    "1. Carefully read and understand both the input data and the schema before making any changes or responding.\n" +
    "2. STRICTLY follow the schema structure and types. Do not add, remove, or reorder properties or array items except as required to match the schema.\n" +
    "3. For each row/object in the input, preserve all values exactly. Only rename keys or add missing properties with default values. Do not reorder, remove, or add rows/objects.\n" +
    "4. If the input data already matches the schema, return it exactly as-is, with no changes, no reordering, and no removals.\n" +
    "5. Do not change, remove, or invent any values. Only rename keys or restructure as needed to match the schema.\n" +
    "6. For XLSX/tabular data: If the data is an array of objects with column names, use those column names as the 'label', 'name', or similar property in the schema. Do not change the values.\n" +
    "7. If a property is missing, add it with a default value (empty string for strings, 0 for numbers, 'white' for colors, etc.), but do not remove any existing properties or array items.\n" +
    "8. If the schema contains a 'title', 'subtitle', 'intro', or 'outro' property, generate a meaningful placeholder for it that accurately reflects the data contents (e.g., summarize, describe, or label the dataset), and do not leave it blank or generic.\n" +
    "9. Do not introduce null values. Use default values as above.\n" +
    "10. If you must rename a property to match the schema, do so, but keep the value unchanged.\n" +
    "11. Never remove or filter out any data from the input, even if it is not required by the schema.\n" +
    (extraRule ? extraRule : "") +
    "\nExamples:\n" +
    "- If the input is already valid, return it as-is.\n" +
    "- If the input has extra properties, keep them.\n" +
    "- If the input is missing properties, add them with default values.\n" +
    "- For tabular data, only rename keys, never change values. For example:\n" +
    "  Input: [ { year: 2020, revenue: 15000 }, { year: 2021, revenue: 18000 } ]\n" +
    "  Schema: [ { label: string, value: number } ]\n" +
    "  Output: [ { label: 2020, value: 15000 }, { label: 2021, value: 18000 } ]\n" +
    "\nInput data (as JSON code block):\n" +
    "```\n" +
    formattedInput +
    "\n```\n" +
    "\nSchema (as JSON code block):\n" +
    "```\n" +
    formattedSchema +
    "\n```\n";

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt,
            },
          ],
        },
      ],
      // No responseSchema, let the model output plain JSON
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const text = result.response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("AI did not return valid JSON: " + text);
    }

    console.log("Ai Formattted data: ", data);
    return data;
  } catch (error: any) {
    console.error(error);
  }
}

export default router;
