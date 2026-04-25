import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Import your custom modules
import { db } from "./firebase.js";
import { extractRequestData } from "./aiExtractor.js";
import { findBestVolunteerMatch } from "./aiMatcher.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not set in the environment.");
  process.exit(1);
}

const app = express();
app.use(express.json());

const corsOptions = {
  origin: ["*", "http://localhost:5173"],
  credentials: true,
};
app.use(cors(corsOptions));

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "relieflink-functions" });
});

// Endpoint 1: Extract and save to Firestore
app.post("/extract-request", async (req, res) => {
  const text = req.body?.text ?? "";

  if (!text.trim()) {
    return res.status(400).json({ error: "Request text is required" });
  }

  try {
    const extractedData = await extractRequestData(text);

    // Create the full document payload
    const requestDoc = {
      raw_text: text,
      ...extractedData,
      lat: null,
      lng: null,
      status: extractedData.confidence < 0.6 ? "needs_review" : "pending",
      assigned_volunteer_id: null,
      assignment_rationale: null,
      created_at: new Date().toISOString(),
      assigned_at: null,
      completed_at: null,
    };

    // Save to Firestore 'requests' collection
    const docRef = await db.collection("requests").add(requestDoc);

    res.json({
      id: docRef.id,
      ...requestDoc,
    });
  } catch (error) {
    res.status(500).json({
      error: "Extraction failed",
      message: error.message,
    });
  }
});

// Endpoint 2: Match using AI and update Firestore
app.post("/match-request", async (req, res) => {
  const { requestId } = req.body;

  if (!requestId) {
    return res.status(400).json({ error: "requestId is required" });
  }

  try {
    // 1. Get the specific request from Firestore
    const requestSnapshot = await db
      .collection("requests")
      .doc(requestId)
      .get();
    if (!requestSnapshot.exists) {
      return res.status(404).json({ error: "Request not found" });
    }
    const requestData = requestSnapshot.data();

    // 2. Get available volunteers from Firestore
    const volunteersSnapshot = await db
      .collection("volunteers")
      .where("status", "==", "available")
      .get();

    if (volunteersSnapshot.empty) {
      return res.json({ message: "No volunteers currently available." });
    }

    const availableVolunteers = volunteersSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // 3. Ask Gemini Matcher to make a decision
    const matchDecision = await findBestVolunteerMatch(
      requestData,
      availableVolunteers,
    );

    // 4. Update the Database if a match was made
    if (matchDecision.volunteerId && matchDecision.volunteerId !== "NONE") {
      const batch = db.batch();

      // Update Request Document
      const reqRef = db.collection("requests").doc(requestId);
      batch.update(reqRef, {
        status: "assigned",
        assigned_volunteer_id: matchDecision.volunteerId,
        assignment_rationale: matchDecision.rationale,
        assigned_at: new Date().toISOString(),
      });

      // Update Volunteer Document
      const volRef = db.collection("volunteers").doc(matchDecision.volunteerId);
      batch.update(volRef, { status: "dispatched" });

      await batch.commit();
    }

    res.json({
      success: true,
      decision: matchDecision,
    });
  } catch (error) {
    console.error("Matching error:", error);
    res.status(500).json({ error: "Matching failed", message: error.message });
  }
});

// Endpoint 3: Add or update user profile
app.post("/add-user", async (req, res) => {
  const { firebaseUid, email, name, role, skills } = req.body;

  if (!firebaseUid || !email || !name || !role) {
    return res.status(400).json({
      error: "firebaseUid, email, name, and role are required",
    });
  }

  if (!["ADMIN", "VOLUNTEER"].includes(role)) {
    return res.status(400).json({ error: "role must be ADMIN or VOLUNTEER" });
  }

  try {
    const userRef = db.collection("users").doc(firebaseUid);
    const userDoc = await userRef.get();

    const userData = {
      firebaseUid,
      email,
      name,
      role,
      skills: Array.isArray(skills) ? skills : [],
      status: role === "ADMIN" ? "active" : "available",
      updated_at: new Date().toISOString(),
    };

    if (!userDoc.exists) {
      userData.created_at = new Date().toISOString();
    }

    await userRef.set(userData, { merge: true });

    res.json({
      id: firebaseUid,
      ...userData,
    });
  } catch (error) {
    console.error("Add user error:", error);
    res
      .status(500)
      .json({ error: "Failed to save user", message: error.message });
  }
});

// Endpoint 4: Get user profile by Firebase UID
app.get("/user/:firebaseUid", async (req, res) => {
  const { firebaseUid } = req.params;

  if (!firebaseUid) {
    return res.status(400).json({ error: "firebaseUid is required" });
  }

  try {
    const userDoc = await db.collection("users").doc(firebaseUid).get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      id: userDoc.id,
      ...userDoc.data(),
    });
  } catch (error) {
    console.error("Get user error:", error);
    res
      .status(500)
      .json({ error: "Failed to get user", message: error.message });
  }
});

// Endpoint 5: Get all tasks/requests
app.get("/tasks", async (req, res) => {
  try {
    const tasksSnapshot = await db.collection("requests").get();

    const tasks = tasksSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    res
      .status(500)
      .json({ error: "Failed to get tasks", message: error.message });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`ReliefLink functions running on http://localhost:${port}`);
});
