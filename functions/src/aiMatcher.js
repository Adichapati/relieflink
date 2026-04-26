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

Available Volunteers (distance_km is the haversine distance to the request, in kilometres; null means unknown):
${JSON.stringify(availableVolunteers, null, 2)}

Pick the SINGLE best volunteer using these priorities, in order:
1. Skill match for the request category (medical for medicine, food prep for food, etc).
2. Lowest distance_km when known.
3. General availability.

If no volunteer is a safe or logical fit, return volunteerId as "NONE".

Return:
- volunteerId: the id of the chosen volunteer (or "NONE")
- rationale: ONE short sentence (max 25 words) that names the volunteer, cites the matching skill, and includes the distance like "1.4 km away" when available.
- confidenceScore: 0.0 to 1.0`;

    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error("AI Matching Error:", error);
    throw new Error("Failed to generate volunteer match.");
  }
}
