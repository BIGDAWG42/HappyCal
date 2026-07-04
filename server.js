// HappyCal backend — minimal version, no accounts, no database.
// Its only job is to keep your Anthropic API key off the browser.
// Env var required (set in Render's dashboard):
//   ANTHROPIC_API_KEY - your Anthropic API key (from console.anthropic.com)

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '15mb' })); // food photos are base64-encoded, so allow a larger body
app.use(express.static(path.join(__dirname, 'public')));

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

app.post('/api/analyze', async (req, res) => {
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'Server is missing ANTHROPIC_API_KEY. Set it in Render environment variables.' });
  }
  try {
    const { imageBase64, mediaType } = req.body;
    if (!imageBase64 || !mediaType) return res.status(400).json({ error: 'Missing image data.' });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: "Look at this food photo and estimate its nutrition. Respond with ONLY a JSON object, no markdown fences, no preamble, no extra text. Use this exact shape: {\"food_name\": string (short, e.g. 'Grilled chicken salad'), \"portion_estimate\": string (e.g. '~350g / 1 bowl'), \"calories\": integer, \"protein_g\": integer, \"carbs_g\": integer, \"fat_g\": integer, \"confidence\": one of 'low','medium','high', \"note\": string (max 15 words, mention any major assumption made)}. If multiple items are visible, estimate the combined plate as one entry. If the image doesn't show food, set food_name to 'No food detected' and all numeric fields to 0." }
          ]
        }]
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(502).json({ error: 'The AI service returned an error.' });
    }

    const textBlock = (data.content || []).map(c => c.text || '').join('');
    const clean = textBlock.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(clean);
    res.json(parsed);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Could not analyze that photo.' });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`HappyCal server running on port ${PORT}`));
