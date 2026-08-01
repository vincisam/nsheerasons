const fetch = require('node-fetch');

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * Calls the Gemini generateContent endpoint.
 *
 * @param {Object} opts
 * @param {string} opts.prompt - The user/system-combined text prompt.
 * @param {Object} [opts.inlineImage] - Optional { mimeType, base64Data } for multimodal input.
 * @param {boolean} [opts.jsonMode] - If true, asks Gemini to return raw JSON (no markdown fences).
 * @param {string} [opts.model] - Overrides the default model from env.
 * @returns {Promise<string>} raw text returned by the model
 */
async function generateContent({ prompt, inlineImage, jsonMode = false, model }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured on the server');
  }

  const modelName =
    model || (inlineImage ? process.env.GEMINI_VISION_MODEL : process.env.GEMINI_MODEL) || 'gemini-2.0-flash';

  const parts = [{ text: prompt }];
  if (inlineImage?.base64Data) {
    parts.push({
      inline_data: {
        mime_type: inlineImage.mimeType || 'image/jpeg',
        data: inlineImage.base64Data,
      },
    });
  }

  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: 0.8,
      topP: 0.95,
      maxOutputTokens: 1024,
      ...(jsonMode ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const url = `${GEMINI_API_BASE}/${modelName}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok) {
    const errMsg = data?.error?.message || `Gemini API error (status ${res.status})`;
    throw new Error(errMsg);
  }

  const text = data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('\n');

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  return text;
}

/**
 * Parses a Gemini text response as JSON, stripping markdown code fences if present.
 */
function parseJsonResponse(raw) {
  const cleaned = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch (err) {
    throw new Error('Failed to parse Gemini response as JSON: ' + err.message);
  }
}

module.exports = { generateContent, parseJsonResponse };
