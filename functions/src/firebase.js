import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
// IMPORTANT: Download this from your Firebase Console and place it in the root folder.
// DO NOT commit it to GitHub.
import serviceAccount from "./serviceAccountKey.json" with { type: "json" };

initializeApp({
  credential: cert(serviceAccount),
});

export const db = getFirestore();
