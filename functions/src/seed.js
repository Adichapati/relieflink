import { db } from "./firebase.js";

const VOLUNTEERS = [
  {
    id: "seed-vol-priya",
    name: "Priya Nair",
    email: "priya@relieflink.demo",
    role: "VOLUNTEER",
    skills: ["medical", "first aid", "translation"],
    lat: 12.97,
    lng: 77.59,
    location_text: "Bangalore",
    status: "available",
  },
  {
    id: "seed-vol-arjun",
    name: "Arjun Mehta",
    email: "arjun@relieflink.demo",
    role: "VOLUNTEER",
    skills: ["logistics", "transport", "food prep"],
    lat: 12.93,
    lng: 77.62,
    location_text: "Bangalore - HSR",
    status: "available",
  },
  {
    id: "seed-vol-leila",
    name: "Leila Hassan",
    email: "leila@relieflink.demo",
    role: "VOLUNTEER",
    skills: ["medical", "shelter", "communications"],
    lat: 19.08,
    lng: 72.88,
    location_text: "Mumbai",
    status: "available",
  },
  {
    id: "seed-vol-sam",
    name: "Sam Okonkwo",
    email: "sam@relieflink.demo",
    role: "VOLUNTEER",
    skills: ["transport", "logistics"],
    lat: 28.61,
    lng: 77.23,
    location_text: "Delhi",
    status: "available",
  },
  {
    id: "seed-vol-mei",
    name: "Mei Tanaka",
    email: "mei@relieflink.demo",
    role: "VOLUNTEER",
    skills: ["food prep", "translation", "shelter"],
    lat: 13.08,
    lng: 80.27,
    location_text: "Chennai",
    status: "available",
  },
  {
    id: "seed-vol-diego",
    name: "Diego Alvarez",
    email: "diego@relieflink.demo",
    role: "VOLUNTEER",
    skills: ["medical", "first aid"],
    lat: 17.39,
    lng: 78.49,
    location_text: "Hyderabad",
    status: "available",
  },
];

const REQUESTS = [
  {
    raw_text:
      "URGENT - need food and water at riverside community center in Bangalore. ~200 families displaced by flooding. Children and elderly priority.",
    category: "food",
    urgency: "critical",
    location_text: "Bangalore - Riverside",
    quantity_details: "200 families, children and elderly priority",
    confidence: 0.95,
    lat: 12.97,
    lng: 77.59,
    status: "pending",
  },
  {
    raw_text:
      "Need insulin and basic medical supplies for diabetic camp in Mumbai. About 40 people. Running low.",
    category: "medicine",
    urgency: "high",
    location_text: "Mumbai",
    quantity_details: "Insulin + supplies for ~40 diabetic patients",
    confidence: 0.92,
    lat: 19.08,
    lng: 72.88,
    status: "pending",
  },
  {
    raw_text:
      "Drinking water needed near central station Delhi. Around 80 people, 12 children.",
    category: "water",
    urgency: "high",
    location_text: "Delhi",
    quantity_details: "80 people, 12 children",
    confidence: 0.9,
    lat: 28.61,
    lng: 77.23,
    status: "pending",
  },
  {
    raw_text:
      "Necesitamos comida y mantas para 15 familias en una escuela cerca del centro. Por favor ayuda.",
    category: "food",
    urgency: "medium",
    location_text: "Chennai",
    quantity_details: "15 families - food and blankets (translated from Spanish)",
    confidence: 0.78,
    lat: 13.08,
    lng: 80.27,
    status: "pending",
  },
  {
    raw_text:
      "Hi, my grandmother in Hyderabad needs help getting her medicines refilled. She's 78 and lives alone.",
    category: "medicine",
    urgency: "medium",
    location_text: "Hyderabad",
    quantity_details: "1 elderly person, medicine refill",
    confidence: 0.88,
    lat: 17.39,
    lng: 78.49,
    status: "pending",
  },
  {
    raw_text:
      "msg unclear, sounds like food maybe shelter near mg road area something flooding",
    category: "general_relief",
    urgency: "high",
    location_text: "MG Road",
    quantity_details: "Unclear - manual review needed",
    confidence: 0.45,
    lat: 12.97,
    lng: 77.59,
    status: "needs_review",
  },
  {
    raw_text:
      "Family of 5 in Bangalore HSR layout, no power for 2 days, baby needs formula and warm clothes.",
    category: "general_relief",
    urgency: "high",
    location_text: "Bangalore - HSR Layout",
    quantity_details: "Family of 5 + infant, formula + warm clothes",
    confidence: 0.93,
    lat: 12.93,
    lng: 77.62,
    status: "pending",
  },
  {
    raw_text:
      "Temporary shelter needed for 25 people displaced from low-lying area. Mumbai west.",
    category: "shelter",
    urgency: "high",
    location_text: "Mumbai West",
    quantity_details: "25 displaced persons",
    confidence: 0.9,
    lat: 19.08,
    lng: 72.88,
    status: "pending",
  },
];

async function clearCollection(name) {
  const snap = await db.collection(name).get();
  if (snap.empty) return 0;
  const batch = db.batch();
  snap.docs.forEach((d) => batch.delete(d.ref));
  await batch.commit();
  return snap.size;
}

async function seed() {
  const reset = process.argv.includes("--reset");

  if (reset) {
    console.log("Resetting requests collection...");
    const removed = await clearCollection("requests");
    console.log(`  ✓ removed ${removed} old requests`);
  }

  console.log("Seeding volunteers into users collection...");
  const volBatch = db.batch();
  for (const v of VOLUNTEERS) {
    const ref = db.collection("users").doc(v.id);
    volBatch.set(ref, {
      ...v,
      firebaseUid: v.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
  }
  await volBatch.commit();
  console.log(`  ✓ ${VOLUNTEERS.length} volunteers seeded`);

  console.log("Seeding sample requests...");
  const reqBatch = db.batch();
  for (const r of REQUESTS) {
    const ref = db.collection("requests").doc();
    reqBatch.set(ref, {
      ...r,
      assigned_volunteer_id: null,
      assigned_volunteer_name: null,
      assignment_rationale: null,
      created_at: new Date().toISOString(),
      assigned_at: null,
      completed_at: null,
    });
  }
  await reqBatch.commit();
  console.log(`  ✓ ${REQUESTS.length} requests seeded`);

  console.log("\nSeed complete.");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
