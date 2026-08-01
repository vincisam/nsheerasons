const asyncHandler = require('express-async-handler');
const DesignRequest = require('../models/DesignRequest');
const { generateDesignConcept } = require('../services/jewelleryDesignService');
const { success } = require('../utils/apiResponse');

// @route POST /api/ai/jewellery-design
// Accepts JSON body; if a reference image was uploaded via multipart,
// multer middleware attaches it at req.file.
const createDesign = asyncHandler(async (req, res) => {
  const { jewelleryType, occasion, metal, gemstones, style, budgetRange, notes } = req.body;

  const input = {
    jewelleryType,
    occasion,
    metal,
    gemstones: Array.isArray(gemstones) ? gemstones : gemstones ? String(gemstones).split(',').map((s) => s.trim()) : [],
    style,
    budgetRange,
    notes,
  };

  let referenceImage;
  if (req.file) {
    referenceImage = {
      mimeType: req.file.mimetype,
      base64Data: req.file.buffer.toString('base64'),
    };
  }

  let parsed, raw;
  try {
    ({ parsed, raw } = await generateDesignConcept(input, referenceImage));
  } catch (err) {
    await DesignRequest.create({
      user: req.user._id,
      input,
      status: 'failed',
      rawModelResponse: err.message,
    });
    res.status(502);
    throw new Error(`AI design generation failed: ${err.message}`);
  }

  const record = await DesignRequest.create({
    user: req.user._id,
    input,
    result: parsed,
    rawModelResponse: raw,
    status: 'completed',
  });

  success(res, { designRequest: record }, 'Design concept generated', 201);
});

// @route GET /api/ai/jewellery-design
const listDesigns = asyncHandler(async (req, res) => {
  const designs = await DesignRequest.find({ user: req.user._id }).sort({ createdAt: -1 });
  success(res, { designs });
});

// @route GET /api/ai/jewellery-design/:id
const getDesign = asyncHandler(async (req, res) => {
  const design = await DesignRequest.findOne({ _id: req.params.id, user: req.user._id });
  if (!design) {
    res.status(404);
    throw new Error('Design request not found');
  }
  success(res, { design });
});

module.exports = { createDesign, listDesigns, getDesign };
