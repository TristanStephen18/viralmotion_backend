import { SchemaType, type Schema } from "@google/generative-ai";
//batch rendering datasets
export const QuoteDataPropsSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      text: { type: SchemaType.STRING },
      author: { type: SchemaType.STRING },
    },
    required: ["text", "author"],
  },
};

export const TextTypingTemplatePhraseSchema: Schema = {
  type: SchemaType.ARRAY,
  items: { type: SchemaType.STRING },
};

export const TextTypingTemplateSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      lines: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING },
      },
      category: { type: SchemaType.STRING },
      mood: { type: SchemaType.STRING },
    },
    required: ["lines", "category", "mood"],
  },
};

export const BarGraphDataSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      data: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            name: { type: SchemaType.STRING },
            value: { type: SchemaType.NUMBER },
          },
          required: ["name", "value"],
        },
      },
      title: { type: SchemaType.STRING },
      subtitle: { type: SchemaType.STRING },
    },
    required: ["data", "title", "subtitle"],
  },
};

export const CurveLineTrendSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      title: { type: SchemaType.STRING },
      subtitle: { type: SchemaType.STRING },
      data: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            label: { type: SchemaType.NUMBER },
            value: { type: SchemaType.NUMBER },
          },
          required: ["label", "value"],
        },
      },
      dataType: { type: SchemaType.STRING },
    },
    required: ["title", "subtitle", "data", "dataType"],
  },
};

export const FactCardsTemplateDatasetSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      intro: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          subtitle: { type: SchemaType.STRING },
        },
        required: ["title", "subtitle"],
      },
      outro: {
        type: SchemaType.OBJECT,
        properties: {
          title: { type: SchemaType.STRING },
          subtitle: { type: SchemaType.STRING },
        },
        required: ["title", "subtitle"],
      },
      facts: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            title: { type: SchemaType.STRING },
            description: { type: SchemaType.STRING },
          },
          required: ["title", "description"],
        },
      },
    },
    required: ["intro", 'outro', "facts"]
  },
};

export const KpiFlipCardsDatasetSchema: Schema = {
  type: SchemaType.ARRAY,
  items: {  
    type: SchemaType.OBJECT,
    properties: {
      cardBorderColor: {type: SchemaType.STRING}, 
      valueFontSize: { type: SchemaType.NUMBER },
      cardLabelFontSize: { type: SchemaType.NUMBER },
      cardLabelColor: { type: SchemaType.STRING },
      cardColorBack: { type: SchemaType.STRING },
      cardColorFront: { type: SchemaType.STRING },
      title: { type: SchemaType.STRING },   
      subtitle: { type: SchemaType.STRING },
      cardsData: {
        type: SchemaType.ARRAY,
        items: {
          type: SchemaType.OBJECT,
          properties: {
            front: {
              type: SchemaType.OBJECT,
              properties: {
                label: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING },
                color: { type: SchemaType.STRING },
              },
              required: ["label", "value", "color"],
            },
            back: {
              type: SchemaType.OBJECT,
              properties: {
                label: { type: SchemaType.STRING },
                value: { type: SchemaType.STRING },
                color: { type: SchemaType.STRING },
              },  
              required: ["label", "value", "color"],
            },
          },
          required: ["front", "back"],
        },
      },
    },
    required: ["title", "subtitle", "cardsData", "cardLabelColor", "cardLabelFontSize", "cardColorBack", "cardColorFront", "valueFontSize", "cardBorderColor"],
  },
};

//ai assistant datasets
export const SingleOutputQuoteSpotlightSchema: Schema = {
  type: SchemaType.OBJECT,
  properties: {
    quote: { type: SchemaType.STRING },
    author: { type: SchemaType.STRING },
    backgroundImage: { type: SchemaType.STRING },
    fontFamily: { type: SchemaType.STRING },
    fontColor: { type: SchemaType.STRING },
  },
  required: ["quote", "author", "backgroundImage", "fontFamily", "fontColor"],
};
