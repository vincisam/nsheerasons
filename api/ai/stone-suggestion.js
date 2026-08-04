const { generateStoneSuggestion } = require('../../nsheera-backend/src/services/astroStoneService');

const parseBody = async (req) => {
  if (req.body && typeof req.body === 'object') {
    return req.body;
  }

  const contentType = req.headers['content-type'] || '';
  if (!contentType.includes('application/json')) return {};

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  if (!chunks.length) return {};
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch (err) {
    return {};
  }
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const {
    dob,
    timeOfBirth,
    placeOfBirth,
    knownRashi,
    knownNakshatra,
    focusArea,
  } = await parseBody(req);

  if (!dob) {
    return res.status(400).json({ success: false, message: 'Date of birth is required' });
  }

  try {
    const { parsed } = await generateStoneSuggestion({
      dob,
      timeOfBirth,
      placeOfBirth,
      knownRashi,
      knownNakshatra,
      focusArea,
    });
    return res.status(201).json(parsed);
  } catch (err) {
    console.error('AI stone suggestion failed:', err?.message || err);
    return res.status(502).json({ success: false, message: 'AI stone suggestion failed', error: err?.message || 'Unknown error' });
  }
};
