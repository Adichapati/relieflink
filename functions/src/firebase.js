import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

function loadServiceAccount() {
  // Production / Vercel: pass the JSON as a single env var
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (err) {
      throw new Error(
        "FIREBASE_SERVICE_ACCOUNT env var is not valid JSON: " + err.message,
      );
    }
  }

  // Local dev: read serviceAccountKey.json next to this module
  const here = dirname(fileURLToPath(import.meta.url));
  const path = resolve(here, "./serviceAccountKey.json");
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    throw new Error(
      "Could not load Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT or place serviceAccountKey.json in functions/src/. Original error: " +
        err.message,
    );
  }
}

// initializeApp throws if called twice (matters in Vercel warm starts)
if (!getApps().length) {
  initializeApp({ credential: cert(loadServiceAccount()) });
}

export const db = getFirestore();
export const auth = getAuth();
