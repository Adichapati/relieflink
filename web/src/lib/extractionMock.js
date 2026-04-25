// Fallback mock extraction for when backend is unavailable
const CATEGORY_KEYWORDS = {
  medical: ["medicine", "medical", "injury", "doctor", "sick"],
  water: ["water", "drinking water"],
  food: ["food", "meal", "hungry", "ration"],
};

function inferCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }
  return "general relief";
}

function inferUrgency(text) {
  const lower = text.toLowerCase();
  if (
    ["urgent", "immediately", "asap", "critical", "sick"].some((token) =>
      lower.includes(token),
    )
  ) {
    return "high";
  }
  if (["important", "soon", "today"].some((token) => lower.includes(token))) {
    return "medium";
  }
  return "low";
}

function inferLocation(text) {
  const match = text.match(/at\s+([^.,]+)/i) || text.match(/near\s+([^.,]+)/i);
  return match ? match[1].trim() : "location review needed";
}

function inferDetails(text) {
  const peopleMatch = text.match(
    /(family of \d+|\d+ adults?|\d+ children|elderly couple)/i,
  );
  return peopleMatch ? peopleMatch[0] : "details review needed";
}

function fallbackExtraction(rawText) {
  const urgency = inferUrgency(rawText);
  return {
    category: inferCategory(rawText),
    urgency,
    locationText: inferLocation(rawText),
    quantityOrDetails: inferDetails(rawText),
    confidence: urgency === "high" ? "review" : "ok",
    lat: 12.9716,
    lng: 77.5946,
  };
}

export async function extractRequestFields(rawText) {
  try {
    const response = await fetch("http://localhost:8787/extract-request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: rawText }),
    });

    if (!response.ok) {
      console.warn("Backend extraction failed, using fallback");
      return fallbackExtraction(rawText);
    }

    const data = await response.json();
    const source = data.output ?? data;
    const confidenceValue = source.confidence;

    return {
      id: data.id ?? source.id ?? null,
      status:
        source.status ??
        (typeof confidenceValue === "number" && confidenceValue < 0.6
          ? "needs_review"
          : "pending"),
      category: source.category,
      urgency: source.urgency,
      locationText: source.location_text ?? source.locationText,
      quantityOrDetails: source.quantity_details ?? source.quantityOrDetails,
      confidence:
        typeof confidenceValue === "number"
          ? confidenceValue < 0.6
            ? "review"
            : "high"
          : confidenceValue,
      lat: 12.9716,
      lng: 77.5946,
    };
  } catch (error) {
    console.warn("Backend unavailable, using fallback extraction:", error);
    return fallbackExtraction(rawText);
  }
}
