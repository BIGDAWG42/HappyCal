// HappyCal backend — minimal version, no accounts, no database.
// Its only job is to keep your Gemini API key off the browser.
// Env var required (set in Render's dashboard):
//   GEMINI_API_KEY - free API key from https://aistudio.google.com/apikey (no credit card required)

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' })); // food photos are base64-encoded, so allow a larger body
app.use(express.static(path.join(__dirname, 'public')));

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-3-flash-preview'; // free-tier vision-capable model as of mid-2026 — check https://ai.google.dev/gemini-api/docs/pricing if this ever errors as deprecated

app.post('/api/analyze', async (req, res) => {
  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'Server is missing GEMINI_API_KEY. Set it in Render environment variables.' });
  }
  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64 || !mediaType) return res.status(400).json({ error: 'Missing image data.' });

    const prompt = "Look at this food photo and estimate its nutrition. Respond with ONLY a JSON object, no markdown fences, no preamble, no extra text. Use this exact shape: {\"food_name\": string (short, e.g. 'Grilled chicken salad'), \"portion_estimate\": string (e.g. '~350g / 1 bowl'), \"calories\": integer, \"protein_g\": integer, \"carbs_g\": integer, \"fat_g\": integer, \"confidence\": one of 'low','medium','high', \"note\": string (max 15 words, mention any major assumption made)}. If multiple items are visible, estimate the combined plate as one entry. If the image doesn't show food, set food_name to 'No food detected' and all numeric fields to 0.";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              { inlineData: { mimeType: mediaType, data: imageBase64 } }
            ]
          }]
        })
      }
    );

    const data = await response.json();
    if (!response.ok) {
      console.error('Gemini API error:', data);
      const reason = (data && data.error && data.error.message) || 'The AI service returned an error.';
      return res.status(502).json({ error: reason });
    }

    const parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
    const textBlock = parts.map(p => p.text || '').join('');
    const clean = textBlock.replace(/```json|```/g, '').trim();

    if (!clean) {
      console.error('Gemini returned no text. Full response:', JSON.stringify(data));
      return res.status(502).json({ error: 'The AI service returned an empty response.' });
    }

    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Could not analyze that photo: ' + err.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HappyCal server running on port ${PORT}`));
