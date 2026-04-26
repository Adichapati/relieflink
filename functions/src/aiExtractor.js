import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const extractionSchema = {
  type: SchemaType.OBJECT,
  properties: {
    category: {
      type: SchemaType.STRING,
      enum: ["food", "medicine", "water", "shelter", "general_relief"],
    },
    urgency: {
      type: SchemaType.STRING,
      enum: ["low", "medium", "high", "critical"],
    },
    location_text: { type: SchemaType.STRING },
    quantity_details: { type: SchemaType.STRING },
    confidence: { type: SchemaType.NUMBER },
  },
  required: [
    "category",
    "urgency",
    "location_text",
    "quantity_details",
    "confidence",
  ],
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: extractionSchema,
    temperature: 0.1,
  },
});

const FALLBACK = {
  category: "general_relief",
  urgency: "high",
  location_text: "NEEDS MANUAL REVIEW",
  quantity_details: "NEEDS MANUAL REVIEW",
  confidence: 0.0,
};

export async function extractRequestData(rawText) {
  try {
    const prompt = `Extract emergency details. Translate non-English text to English. Text: "${rawText}"`;
    const result = await model.generateContent(prompt);
    const extractedData = JSON.parse(result.response.text());

    if (extractedData.confidence < 0.6) {
      throw new Error("Confidence too low");
    }

    return extractedData;
  } catch (error) {
    console.error("\n[DEBUG ERROR]:", error.message);
    return FALLBACK;
  }
}

/**
 * Extract emergency details from a base64-encoded audio clip.
 * Mime types Gemini accepts inline: wav, mp3, aiff, aac, ogg, flac.
 * Returns the same schema as extractRequestData plus a transcript field.
 */
export async function extractRequestFromAudio(audioBase64, mimeType = "audio/wav") {
  try {
    const result = await model.generateContent([
      {
        inlineData: {
          data: audioBase64,
          mimeType,
        },
      },
      `This is a spoken disaster-relief distress message. First, transcribe it. Then extract emergency details. Translate non-English speech to English. Put the original transcript inside quantity_details if it adds context.`,
    ]);
    const extractedData = JSON.parse(result.response.text());

    if (extractedData.confidence < 0.6) {
      throw new Error("Confidence too low");
    }

    return extractedData;
  } catch (error) {
    console.error("\n[AUDIO EXTRACT ERROR]:", error.message);
    return FALLBACK;
  }
}
