import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Import your custom modules
import { db } from "./firebase.js";
import { extractRequestData, extractRequestFromAudio } from "./aiExtractor.js";
import { findBestVolunteerMatch } from "./aiMatcher.js";
import { geocode, distanceKm } from "./geocode.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not set in the environment.");
  process.exit(1);
}

const app = express();
// Audio uploads can run several MB once base64-encoded, so raise the limit.
app.use(express.json({ limit: "12mb" }));

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
    const { lat, lng } = geocode(extractedData.location_text || text);

    // Create the full document payload
    const requestDoc = {
      raw_text: text,
      source: "text",
      ...extractedData,
      lat,
      lng,
      status:
        extractedData.confidence < 0.6 ? "needs_review" : "needs_approval",
      assigned_volunteer_id: null,
      assigned_volunteer_name: null,
      assignment_rationale: null,
      created_at: new Date().toISOString(),
      approved_at: null,
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

// Voice intake — audio in, structured request out
app.post("/extract-voice", async (req, res) => {
  const { audioBase64, mimeType } = req.body || {};
  if (!audioBase64 || typeof audioBase64 !== "string") {
    return res.status(400).json({ error: "audioBase64 is required" });
  }

  try {
    const extractedData = await extractRequestFromAudio(
      audioBase64,
      mimeType || "audio/wav",
    );
    const { lat, lng } = geocode(extractedData.location_text || "");

    const requestDoc = {
      raw_text: `[VOICE] ${extractedData.quantity_details || "audio distress message"}`,
      source: "voice",
      ...extractedData,
      lat,
      lng,
      status:
        extractedData.confidence < 0.6 ? "needs_review" : "needs_approval",
      assigned_volunteer_id: null,
      assigned_volunteer_name: null,
      assignment_rationale: null,
      created_at: new Date().toISOString(),
      approved_at: null,
      assigned_at: null,
      completed_at: null,
    };

    const docRef = await db.collection("requests").add(requestDoc);
    res.json({ id: docRef.id, ...requestDoc });
  } catch (error) {
    console.error("Voice extract error:", error);
    res
      .status(500)
      .json({ error: "Voice extraction failed", message: error.message });
  }
});

// Endpoint 2: Match using AI and update Firestore
app.post("/match-request", async (req, res) => {
  const { requestId, includeSeed = false } = req.body;

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

    // 2. Get available volunteers from the users collection
    const volunteersSnapshot = await db
      .collection("users")
      .where("role", "==", "VOLUNTEER")
      .where("status", "==", "available")
      .get();

    let availableVolunteers = volunteersSnapshot.docs.map((doc) => {
      const v = { id: doc.id, ...doc.data() };
      const km = distanceKm(
        { lat: requestData.lat, lng: requestData.lng },
        { lat: v.lat, lng: v.lng },
      );
      v.distance_km = km != null ? Math.round(km * 10) / 10 : null;
      return v;
    });

    // Hide seeded demo volunteers from real-world matching unless caller opts in
    if (!includeSeed) {
      availableVolunteers = availableVolunteers.filter((v) => !v.is_seed);
    }

    if (availableVolunteers.length === 0) {
      return res.json({ message: "No volunteers currently available." });
    }

    // 3. Ask Gemini Matcher to make a decision
    const matchDecision = await findBestVolunteerMatch(
      requestData,
      availableVolunteers,
    );

    // 4. Update the Database if a match was made
    if (matchDecision.volunteerId && matchDecision.volunteerId !== "NONE") {
      const matchedVolunteer = availableVolunteers.find(
        (v) => v.id === matchDecision.volunteerId,
      );

      const batch = db.batch();

      // Update Request Document
      const reqRef = db.collection("requests").doc(requestId);
      batch.update(reqRef, {
        status: "assigned",
        assigned_volunteer_id: matchDecision.volunteerId,
        assigned_volunteer_name: matchedVolunteer?.name || null,
        assigned_volunteer_lat: matchedVolunteer?.lat ?? null,
        assigned_volunteer_lng: matchedVolunteer?.lng ?? null,
        assigned_volunteer_distance_km: matchedVolunteer?.distance_km ?? null,
        assignment_rationale: matchDecision.rationale,
        assigned_at: new Date().toISOString(),
      });

      // Update Volunteer Document (in users collection)
      const volRef = db.collection("users").doc(matchDecision.volunteerId);
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

// Endpoint 3: Add or update user profile.
// Self-signup is volunteer-only — admin accounts are created out of band
// (via the seed script or directly in the Firebase console).
app.post("/add-user", async (req, res) => {
  const { firebaseUid, email, name, skills, lat, lng, location_text } =
    req.body;

  if (!firebaseUid || !email || !name) {
    return res.status(400).json({
      error: "firebaseUid, email, and name are required",
    });
  }

  try {
    const userRef = db.collection("users").doc(firebaseUid);
    const userDoc = await userRef.get();
    const existing = userDoc.exists ? userDoc.data() : null;

    // Preserve admin role if it was set out-of-band (seed / console).
    // Otherwise force VOLUNTEER. The client cannot promote itself.
    const role = existing?.role === "ADMIN" ? "ADMIN" : "VOLUNTEER";

    // Resolve coordinates. Order of preference:
    //   1. Coordinates the client provided (browser geolocation)
    //   2. Geocoded from location_text (city/area lookup)
    //   3. Whatever was on the existing user doc
    let resolvedLat =
      typeof lat === "number" ? lat : existing?.lat ?? null;
    let resolvedLng =
      typeof lng === "number" ? lng : existing?.lng ?? null;
    if ((resolvedLat == null || resolvedLng == null) && location_text) {
      const r = geocode(location_text);
      if (r.lat != null && r.lng != null) {
        resolvedLat = r.lat;
        resolvedLng = r.lng;
      }
    }

    const userData = {
      firebaseUid,
      email,
      name,
      role,
      skills: Array.isArray(skills) ? skills : existing?.skills || [],
      lat: resolvedLat,
      lng: resolvedLng,
      location_text:
        location_text || existing?.location_text || null,
      status: role === "ADMIN" ? "active" : existing?.status || "available",
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

// Endpoint 6: Mark a request as completed and free the volunteer
app.post("/complete-request", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "requestId is required" });
  }

  try {
    const reqRef = db.collection("requests").doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Request not found" });
    }
    const data = snap.data();

    const batch = db.batch();
    batch.update(reqRef, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });

    if (data.assigned_volunteer_id) {
      const volRef = db.collection("users").doc(data.assigned_volunteer_id);
      batch.update(volRef, { status: "available" });
    }

    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    console.error("Complete request error:", error);
    res
      .status(500)
      .json({ error: "Failed to complete request", message: error.message });
  }
});

// Approve a request — moves needs_approval / needs_review into matchable state
app.post("/approve-request", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "requestId is required" });
  }
  try {
    const reqRef = db.collection("requests").doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Request not found" });
    }
    const data = snap.data();
    if (!["needs_approval", "needs_review"].includes(data.status)) {
      return res
        .status(409)
        .json({ error: `Request is already ${data.status}` });
    }
    await reqRef.update({
      status: "pending",
      approved_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Approve error:", error);
    res
      .status(500)
      .json({ error: "Failed to approve request", message: error.message });
  }
});

// Bulk approve — useful for demo mode
app.post("/approve-all", async (req, res) => {
  try {
    const snap = await db
      .collection("requests")
      .where("status", "in", ["needs_approval", "needs_review"])
      .get();
    if (snap.empty) return res.json({ success: true, approved: 0 });
    const batch = db.batch();
    snap.docs.forEach((d) => {
      batch.update(d.ref, {
        status: "pending",
        approved_at: new Date().toISOString(),
      });
    });
    await batch.commit();
    res.json({ success: true, approved: snap.size });
  } catch (error) {
    console.error("Approve-all error:", error);
    res
      .status(500)
      .json({ error: "Failed to bulk approve", message: error.message });
  }
});

// Manual assignment — coordinator picks the volunteer themselves
app.post("/assign-request", async (req, res) => {
  const { requestId, volunteerId } = req.body;
  if (!requestId || !volunteerId) {
    return res
      .status(400)
      .json({ error: "requestId and volunteerId are required" });
  }
  try {
    const reqRef = db.collection("requests").doc(requestId);
    const reqSnap = await reqRef.get();
    if (!reqSnap.exists) {
      return res.status(404).json({ error: "Request not found" });
    }
    const requestData = reqSnap.data();

    const volRef = db.collection("users").doc(volunteerId);
    const volSnap = await volRef.get();
    if (!volSnap.exists) {
      return res.status(404).json({ error: "Volunteer not found" });
    }
    const volunteer = volSnap.data();
    if (volunteer.role !== "VOLUNTEER") {
      return res
        .status(400)
        .json({ error: "Selected user is not a volunteer" });
    }
    if (volunteer.is_seed) {
      return res.status(400).json({
        error:
          "Seeded demo volunteers cannot be manually assigned. Use Demo Mode for those.",
      });
    }

    const km =
      typeof requestData.lat === "number" &&
      typeof requestData.lng === "number" &&
      typeof volunteer.lat === "number" &&
      typeof volunteer.lng === "number"
        ? distanceKm(
            { lat: requestData.lat, lng: requestData.lng },
            { lat: volunteer.lat, lng: volunteer.lng },
          )
        : null;

    const distancePart =
      km != null ? ` ${(Math.round(km * 10) / 10).toFixed(1)} km away.` : "";

    const batch = db.batch();
    batch.update(reqRef, {
      status: "assigned",
      assigned_volunteer_id: volunteerId,
      assigned_volunteer_name: volunteer.name || null,
      assigned_volunteer_lat: volunteer.lat ?? null,
      assigned_volunteer_lng: volunteer.lng ?? null,
      assigned_volunteer_distance_km: km != null ? Math.round(km * 10) / 10 : null,
      assignment_rationale: `Manually assigned by coordinator.${distancePart}`,
      assigned_at: new Date().toISOString(),
      // Auto-approve at the same time so the workflow flows naturally
      approved_at: requestData.approved_at || new Date().toISOString(),
    });
    batch.update(volRef, { status: "dispatched" });
    await batch.commit();

    res.json({ success: true });
  } catch (error) {
    console.error("Assign error:", error);
    res
      .status(500)
      .json({ error: "Failed to assign request", message: error.message });
  }
});

// Delete a request — also frees any assigned volunteer
app.post("/delete-request", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "requestId is required" });
  }
  try {
    const reqRef = db.collection("requests").doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Request not found" });
    }
    const data = snap.data();
    const batch = db.batch();
    batch.delete(reqRef);
    if (data.assigned_volunteer_id) {
      const volRef = db.collection("users").doc(data.assigned_volunteer_id);
      batch.update(volRef, { status: "available" });
    }
    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    res
      .status(500)
      .json({ error: "Failed to delete request", message: error.message });
  }
});

// List volunteers (for the manual-assign picker).
// Seeded demo volunteers are hidden by default; pass ?includeSeed=true to show them.
app.get("/volunteers", async (req, res) => {
  try {
    let q = db.collection("users").where("role", "==", "VOLUNTEER");
    if (req.query.available === "true") {
      q = q.where("status", "==", "available");
    }
    const snap = await q.get();
    let volunteers = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    if (req.query.includeSeed !== "true") {
      volunteers = volunteers.filter((v) => !v.is_seed);
    }
    res.json(volunteers);
  } catch (error) {
    console.error("List volunteers error:", error);
    res
      .status(500)
      .json({ error: "Failed to list volunteers", message: error.message });
  }
});

// Endpoint 7: Edit extracted fields (human-in-the-loop override)
app.post("/update-request", async (req, res) => {
  const { requestId, updates } = req.body;
  if (!requestId || !updates || typeof updates !== "object") {
    return res
      .status(400)
      .json({ error: "requestId and updates object are required" });
  }

  const allowed = [
    "category",
    "urgency",
    "location_text",
    "quantity_details",
    "lat",
    "lng",
    "status",
  ];
  const safeUpdates = {};
  for (const key of allowed) {
    if (key in updates) safeUpdates[key] = updates[key];
  }
  safeUpdates.updated_at = new Date().toISOString();

  try {
    const reqRef = db.collection("requests").doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Request not found" });
    }
    await reqRef.update(safeUpdates);
    const updated = await reqRef.get();
    res.json({ id: updated.id, ...updated.data() });
  } catch (error) {
    console.error("Update request error:", error);
    res
      .status(500)
      .json({ error: "Failed to update request", message: error.message });
  }
});

// Volunteer-side: accept the assignment (moves to dispatched)
app.post("/accept-mission", async (req, res) => {
  const { requestId, volunteerId } = req.body;
  if (!requestId || !volunteerId) {
    return res
      .status(400)
      .json({ error: "requestId and volunteerId are required" });
  }
  try {
    const reqRef = db.collection("requests").doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Request not found" });
    if (snap.data().assigned_volunteer_id !== volunteerId) {
      return res
        .status(403)
        .json({ error: "This mission is not assigned to you" });
    }
    await reqRef.update({
      status: "dispatched",
      accepted_at: new Date().toISOString(),
    });
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to accept mission", message: error.message });
  }
});

// Volunteer-side: decline (frees volunteer, request back to pending)
app.post("/decline-mission", async (req, res) => {
  const { requestId, volunteerId } = req.body;
  if (!requestId || !volunteerId) {
    return res
      .status(400)
      .json({ error: "requestId and volunteerId are required" });
  }
  try {
    const reqRef = db.collection("requests").doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Request not found" });
    if (snap.data().assigned_volunteer_id !== volunteerId) {
      return res
        .status(403)
        .json({ error: "This mission is not assigned to you" });
    }
    const batch = db.batch();
    batch.update(reqRef, {
      status: "pending",
      assigned_volunteer_id: null,
      assigned_volunteer_name: null,
      assigned_volunteer_lat: null,
      assigned_volunteer_lng: null,
      assigned_volunteer_distance_km: null,
      assignment_rationale: null,
      assigned_at: null,
    });
    batch.update(db.collection("users").doc(volunteerId), {
      status: "available",
    });
    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to decline mission", message: error.message });
  }
});

// Volunteer-side: complete the mission (also frees the volunteer)
app.post("/complete-mission", async (req, res) => {
  const { requestId, volunteerId } = req.body;
  if (!requestId || !volunteerId) {
    return res
      .status(400)
      .json({ error: "requestId and volunteerId are required" });
  }
  try {
    const reqRef = db.collection("requests").doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) return res.status(404).json({ error: "Request not found" });
    if (snap.data().assigned_volunteer_id !== volunteerId) {
      return res
        .status(403)
        .json({ error: "This mission is not assigned to you" });
    }
    const batch = db.batch();
    batch.update(reqRef, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    batch.update(db.collection("users").doc(volunteerId), {
      status: "available",
    });
    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    res
      .status(500)
      .json({ error: "Failed to complete mission", message: error.message });
  }
});

// Endpoint 8: Free the assigned volunteer and reset request to pending
app.post("/reassign-request", async (req, res) => {
  const { requestId } = req.body;
  if (!requestId) {
    return res.status(400).json({ error: "requestId is required" });
  }

  try {
    const reqRef = db.collection("requests").doc(requestId);
    const snap = await reqRef.get();
    if (!snap.exists) {
      return res.status(404).json({ error: "Request not found" });
    }
    const data = snap.data();

    const batch = db.batch();
    batch.update(reqRef, {
      status: "pending",
      assigned_volunteer_id: null,
      assigned_volunteer_name: null,
      assigned_volunteer_lat: null,
      assigned_volunteer_lng: null,
      assigned_volunteer_distance_km: null,
      assignment_rationale: null,
      assigned_at: null,
    });
    if (data.assigned_volunteer_id) {
      const volRef = db.collection("users").doc(data.assigned_volunteer_id);
      batch.update(volRef, { status: "available" });
    }
    await batch.commit();
    res.json({ success: true });
  } catch (error) {
    console.error("Reassign error:", error);
    res
      .status(500)
      .json({ error: "Failed to reassign", message: error.message });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`ReliefLink functions running on http://localhost:${port}`);
});
