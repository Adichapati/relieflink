require('dotenv').config();
const { GoogleGenerativeAI, SchemaType } = require("@google/generative-ai");

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
      enum: ["low", "medium", "high"],
    },
    location_text: {
      type: SchemaType.STRING,
    },
    quantity_details: {
      type: SchemaType.STRING,
    },
    confidence: {
      type: SchemaType.NUMBER,
    }
  },
  required: ["category", "urgency", "location_text", "quantity_details", "confidence"]
};

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: extractionSchema,
    temperature: 0.1,
  }
});

async function extractRequestData(rawText) {
  try {
    const prompt = `Extract emergency details. Translate non-English text to English.
    Text: "${rawText}"`;

    const result = await model.generateContent(prompt);
    const extractedData = JSON.parse(result.response.text());

    if (extractedData.confidence < 0.6) {
      throw new Error("Confidence too low");
    }

    return {
      id: `req_${Date.now()}`,
      raw_text: rawText,
      ...extractedData,
      lat: null,
      lng: null,
      status: "pending",
      assigned_volunteer_id: null,
      matched_volunteer_name: null,
      created_at: new Date().toISOString(),
      assigned_at: null,
      completed_at: null
    };

  } catch (error) {
    console.error("\n[DEBUG ERROR]:", error.message);
    return {
      id: `req_${Date.now()}`,
      raw_text: rawText,
      category: "general_relief",
      urgency: "high",
      location_text: "NEEDS MANUAL REVIEW",
      quantity_details: "NEEDS MANUAL REVIEW",
      confidence: 0.0,
      lat: null,
      lng: null,
      status: "pending",
      assigned_volunteer_id: null,
      matched_volunteer_name: null,
      created_at: new Date().toISOString(),
      assigned_at: null,
      completed_at: null
    };
  }
}

async function runTests() {
  const perfectRequest = "Family of 5 needs urgent food and medicine near Lake Road, child is sick";
  const regionalRequest = "Akkada chala varsham ga undi, drinking water kavali urgently at Ram Nagar";
  const garbageRequest = "hello bro";

  console.log("--- TEST 1: PERFECT ENGLISH ---");
  console.log(await extractRequestData(perfectRequest));

  console.log("\n--- TEST 2: MULTILINGUAL ---");
  console.log(await extractRequestData(regionalRequest));

  console.log("\n--- TEST 3: GARBAGE INPUT (FALLBACK) ---");
  console.log(await extractRequestData(garbageRequest));
}


module.exports = { extractRequestData };




