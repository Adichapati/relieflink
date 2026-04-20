import express from 'express';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'relieflink-functions' });
});

app.post('/extract-request', (req, res) => {
  const text = req.body?.text ?? '';

  // TODO: Replace this mock logic with Gemini / Vertex AI extraction.
  res.json({
    input: text,
    output: {
      category: text.toLowerCase().includes('medicine') ? 'medical' : 'food',
      urgency: text.toLowerCase().includes('urgent') ? 'high' : 'medium',
      locationText: 'location review needed',
      quantityOrDetails: 'details review needed',
      confidence: 'review',
    },
  });
});

app.post('/match-request', (req, res) => {
  // TODO: Replace with Firestore-backed matching service.
  res.json({
    message: 'Matching endpoint scaffolded. Wire this to Firestore and the scoring engine next.',
    request: req.body ?? {},
  });
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`ReliefLink functions running on http://localhost:${port}`);
});
