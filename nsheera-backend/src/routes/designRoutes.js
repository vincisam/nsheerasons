const express = require('express');
const { createDesign, listDesigns, getDesign } = require('../controllers/designController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

router.use(protect);

// multipart/form-data with optional "referenceImage" file field, plus text fields
router.post('/', upload.single('referenceImage'), createDesign);
router.get('/', listDesigns);
router.get('/:id', getDesign);

module.exports = router;
