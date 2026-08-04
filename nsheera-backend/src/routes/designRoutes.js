const express = require('express');
const { createDesign, listDesigns, getDesign } = require('../controllers/designController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

// Allow public AI design generation from the client dashboard.
router.post('/', upload.single('referenceImage'), createDesign);

// Listing and retrieval remain protected.
router.use(protect);
router.get('/', listDesigns);
router.get('/:id', getDesign);

module.exports = router;
