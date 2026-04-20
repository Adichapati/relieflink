const CATEGORY_KEYWORDS = {
  medical: ['medicine', 'medical', 'injury', 'doctor', 'sick'],
  water: ['water', 'drinking water'],
  food: ['food', 'meal', 'hungry', 'ration'],
};

function inferCategory(text) {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }
  return 'general relief';
}

function inferUrgency(text) {
  const lower = text.toLowerCase();
  if (['urgent', 'immediately', 'asap', 'critical', 'sick'].some((token) => lower.includes(token))) {
    return 'high';
  }
  if (['important', 'soon', 'today'].some((token) => lower.includes(token))) {
    return 'medium';
  }
  return 'low';
}

function inferLocation(text) {
  const match = text.match(/at\s+([^.,]+)/i) || text.match(/near\s+([^.,]+)/i);
  return match ? match[1].trim() : 'location review needed';
}

function inferDetails(text) {
  const peopleMatch = text.match(/(family of \d+|\d+ adults?|\d+ children|elderly couple)/i);
  return peopleMatch ? peopleMatch[0] : 'details review needed';
}

export function extractRequestFields(rawText) {
  const urgency = inferUrgency(rawText);
  return {
    category: inferCategory(rawText),
    urgency,
    locationText: inferLocation(rawText),
    quantityOrDetails: inferDetails(rawText),
    confidence: urgency === 'high' ? 'review' : 'ok',
    lat: 12.9716,
    lng: 77.5946,
  };
}
