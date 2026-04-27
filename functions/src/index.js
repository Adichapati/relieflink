import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

if (!process.env.GEMINI_API_KEY) {
  console.error("FATAL ERROR: GEMINI_API_KEY is not set in the environment.");
  process.exit(1);
}

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`ReliefLink functions running on http://localhost:${port}`);
});
