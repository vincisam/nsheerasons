const asyncHandler = require('express-async-handler');
const DesignRequest = require('../models/DesignRequest');
const { generateDesignConcept } = require('../services/jewelleryDesignService');
const { success } = require('../utils/apiResponse');

// Helper: convert the frontend's fileBlock (Anthropic-style) into the
// { mimeType, base64Data } shape the Gemini service expects.
function fileBlockToReferenceImage(fileBlock) {
  if (!fileBlock) return undefined;
  const source = fileBlock.source || {};
  const mimeType = source.media_type || fileBlock.mimeType;
  const base64Data = source.data || fileBlock.base64Data;
  if (!base64Data) return undefined;
  return { mimeType: mimeType || 'image/jpeg', base64Data };
}

// @route POST /api/ai/jewellery-design
// Accepts JSON body: { promptText, fileBlock? } — the frontend's contract.
// fileBlock is an Anthropic-style block: { type:'image'|'document', source:{type:'base64', media_type, data} }.
const createDesign = asyncHandler(async (req, res) => {
  const { promptText, fileBlock } = req.body;

  if (!promptText || !String(promptText).trim()) {
    res.status(400);
    throw new Error('promptText is required');
  }

  const referenceImage = fileBlockToReferenceImage(fileBlock);

  let parsed, raw;
  try {
    ({ parsed, raw } = await generateDesignConcept({ promptText }, referenceImage));
  } catch (err) {
    // Try to persist a failed record (best-effort; user may be anonymous).
    try {
      await DesignRequest.create({
        user: req.user?._id,
        input: { notes: String(promptText).slice(0, 2000) },
        status: 'failed',
        rawModelResponse: err.message,
      });
    } catch (e) { /* ignore persistence errors on failure path */ }
    res.status(502);
    throw new Error(`AI design generation failed: ${err.message}`);
  }

  // Persist the completed request (best-effort; user may be anonymous).
  try {
    await DesignRequest.create({
      user: req.user?._id,
      input: { notes: String(promptText).slice(0, 2000), referenceImageUrl: fileBlock ? 'inline' : undefined },
      result: parsed,
      rawModelResponse: raw,
      status: 'completed',
    });
  } catch (e) { /* ignore persistence errors on success path — return the concept regardless */ }

  // Return the RAW parsed concept directly — the frontend's normalizeDesignConcept
  // expects the concept object at the top level (res.json() === concept), not
  // wrapped in { success, data }.
  res.status(201).json(parsed);
});

// @route GET /api/ai/jewellery-design
const listDesigns = asyncHandler(async (req, res) => {
  const designs = req.user
    ? await DesignRequest.find({ user: req.user._id }).sort({ createdAt: -1 })
    : [];
  success(res, { designs });
});

// @route GET /api/ai/jewellery-design/:id
const getDesign = asyncHandler(async (req, res) => {
  const design = req.user
    ? await DesignRequest.findOne({ _id: req.params.id, user: req.user._id })
    : null;
  if (!design) {
    res.status(404);
    throw new Error('Design request not found');
  }
  success(res, { design });
});

module.exports = { createDesign, listDesigns, getDesign };
