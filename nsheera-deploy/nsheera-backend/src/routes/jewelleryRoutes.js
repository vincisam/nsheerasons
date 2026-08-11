const express = require('express');
const {
  createJewellery,
  listJewellery,
  getJewellery,
  updateJewellery,
  deleteJewellery,
  addImages,
} = require('../controllers/jewelleryController');
const { protect, requireRole } = require('../middleware/auth');
const { diskUpload } = require('../middleware/upload');

const router = express.Router();

// Public catalog browsing — the storefront lists/shows products to
// signed-out visitors, so these two are intentionally not behind `protect`.
router.get('/', listJewellery);
router.get('/:id', getJewellery);

// Staff-only management
router.post('/', protect, requireRole('admin', 'designer'), createJewellery);
router.put('/:id', protect, requireRole('admin', 'designer'), updateJewellery);
router.delete('/:id', protect, requireRole('admin'), deleteJewellery);
router.post(
  '/:id/images',
  protect,
  requireRole('admin', 'designer'),
  diskUpload.array('images', 6),
  addImages
);

module.exports = router;
