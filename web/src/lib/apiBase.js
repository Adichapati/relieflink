// Resolve the API base URL.
//   1. VITE_API_BASE env var wins (set in Vercel dashboard or .env.local).
//   2. Local dev defaults to the standalone Express server on :8787.
//   3. Production fallback is "/api" so the Vercel serverless function picks it up.
export const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.DEV ? 'http://localhost:8787' : '/api');
