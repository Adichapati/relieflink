import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import dotenv from "dotenv";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const matchSchema = {
  type: SchemaType.OBJECT,
  properties: {
    volunteerId: { type: SchemaType.STRING },
    rationale: { type: SchemaType.STRING },
    confidenceScore: { type: SchemaType.NUMBER },
  },
  required: ["volunteerId", "rationale", "confidenceScore"],
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: matchSchema,
    temperature: 0.2, // Low temp for logical matching
  },
});

export async function findBestVolunteerMatch(requestData, availableVolunteers) {
  try {
    const prompt = `You are an expert disaster relief dispatcher. 
    
    Emergency Request Details:
    ${JSON.stringify(requestData, null, 2)}
    
    Available Volunteers:
    ${JSON.stringify(availableVolunteers, null, 2)}
    
    Analyze the request against the volunteers' skills, locations, and capacity. 
    Select the single BEST volunteer for this request. If no one is a safe or logical fit, return volunteerId as "NONE".
    Provide a short rationale for your choice and a confidence score (0.0 to 1.0).`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("AI Matching Error:", error);
    throw new Error("Failed to generate volunteer match.");
  }
}
