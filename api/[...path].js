import app from "../functions/src/app.js";

// Vercel routes /api/* to this function. Strip the /api prefix so the
// Express routes (defined as /extract-request, /tasks, ...) match.
export default function handler(req, res) {
  if (req.url === "/api" || req.url === "/api/") {
    req.url = "/";
  } else if (req.url?.startsWith("/api/")) {
    req.url = req.url.slice(4);
  }
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false, // Express's express.json() handles parsing
  },
};
