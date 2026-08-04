const { generateDesignConcept } = require('../../nsheera-backend/src/services/jewelleryDesignService');

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

const parseReferenceImage = (fileBlock) => {
  if (!fileBlock?.source?.data) return null;
  return {
    mimeType: fileBlock.source.media_type || 'image/jpeg',
    base64Data: fileBlock.source.data,
  };
};

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const {
    promptText,
    fileBlock,
    jewelleryType,
    occasion,
    metal,
    gemstones,
    style,
    budgetRange,
    notes,
  } = await parseBody(req);

  if (!promptText) {
    return res.status(400).json({ success: false, message: 'promptText is required' });
  }

  const input = {
    promptText,
    jewelleryType,
    occasion,
    metal,
    gemstones: Array.isArray(gemstones)
      ? gemstones
      : gemstones
      ? String(gemstones).split(',').map((s) => s.trim())
      : [],
    style,
    budgetRange,
    notes,
  };

  const referenceImage = parseReferenceImage(fileBlock);

  try {
    const { parsed } = await generateDesignConcept(input, referenceImage);
    return res.status(201).json(parsed);
  } catch (err) {
    console.error('AI design generation failed:', err?.message || err);
    return res.status(502).json({ success: false, message: 'AI design generation failed', error: err?.message || 'Unknown error' });
  }
};
