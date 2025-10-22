import { BarGraphDataSchema, CurveLineTrendSchema, FactCardsTemplateDatasetSchema, KpiFlipCardsDatasetSchema, QuoteDataPropsSchema, TextTypingTemplateSchema } from "../models/gemini_schemas.ts";

export function schemaIdentifier (template: string) {
    console.log("Identifying schema for: ", template);
    switch(template){
        case "bargraph":
            return BarGraphDataSchema;
        case "texttyping":
            return TextTypingTemplateSchema;
        case "kpiflipcards":
            return KpiFlipCardsDatasetSchema;
        case "curvelinetrend":
            return CurveLineTrendSchema;
        case "quote":
            return QuoteDataPropsSchema;
        case "factcards":
            return FactCardsTemplateDatasetSchema;
        default:
            console.log("unknown template cannot find schema");
            break;
    }
}