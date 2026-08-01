const asyncHandler = require('express-async-handler');
const Jewellery = require('../models/Jewellery');
const { success } = require('../utils/apiResponse');

// @route POST /api/jewellery (admin/designer only)
const createJewellery = asyncHandler(async (req, res) => {
  const payload = { ...req.body, createdBy: req.user._id };
  const item = await Jewellery.create(payload);
  success(res, { jewellery: item }, 'Jewellery item created', 201);
});

// @route GET /api/jewellery
// Public catalog browsing — supports basic filtering.
const listJewellery = asyncHandler(async (req, res) => {
  const { category, metal, minPrice, maxPrice, style, occasion, q, isActive } = req.query;

  const filter = {};
  if (category) filter.category = category;
  if (metal) filter['metal.type'] = metal;
  if (style) filter.style = style;
  if (occasion) filter.occasion = occasion;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  else filter.isActive = true; // default: only show active items publicly
  if (minPrice || maxPrice) {
    filter['pricing.totalPrice'] = {};
    if (minPrice) filter['pricing.totalPrice'].$gte = Number(minPrice);
    if (maxPrice) filter['pricing.totalPrice'].$lte = Number(maxPrice);
  }
  if (q) {
    filter.$or = [
      { name: new RegExp(q, 'i') },
      { sku: new RegExp(q, 'i') },
      { tags: new RegExp(q, 'i') },
    ];
  }

  const page = Math.max(Number(req.query.page) || 1, 1);
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  const [items, total] = await Promise.all([
    Jewellery.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Jewellery.countDocuments(filter),
  ]);

  success(res, { items, total, page, pages: Math.ceil(total / limit) });
});

// @route GET /api/jewellery/:id
const getJewellery = asyncHandler(async (req, res) => {
  const item = await Jewellery.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Jewellery item not found');
  }
  success(res, { jewellery: item });
});

// @route PUT /api/jewellery/:id (admin/designer only)
const updateJewellery = asyncHandler(async (req, res) => {
  const item = await Jewellery.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Jewellery item not found');
  }
  Object.assign(item, req.body);
  await item.save(); // triggers computePricing() via pre-save hook
  success(res, { jewellery: item }, 'Jewellery item updated');
});

// @route DELETE /api/jewellery/:id (admin only)
const deleteJewellery = asyncHandler(async (req, res) => {
  const item = await Jewellery.findByIdAndDelete(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Jewellery item not found');
  }
  success(res, null, 'Jewellery item deleted');
});

// @route POST /api/jewellery/:id/images (admin/designer only)
// Accepts up to 6 images via multipart field "images"
const addImages = asyncHandler(async (req, res) => {
  const item = await Jewellery.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Jewellery item not found');
  }

  if (!req.files || req.files.length === 0) {
    res.status(400);
    throw new Error('No images uploaded');
  }

  // Files are stored on disk by multer (see middleware/upload.js diskUpload);
  // expose them as relative /uploads URLs.
  const urls = req.files.map((f) => `/uploads/jewellery/${f.filename}`);
  item.images.push(...urls);
  await item.save();

  success(res, { jewellery: item }, 'Images added');
});

module.exports = {
  createJewellery,
  listJewellery,
  getJewellery,
  updateJewellery,
  deleteJewellery,
  addImages,
};
