const express = require('express');
const { createDesign, listDesigns, getDesign } = require('../controllers/designController');
const upload = require('../middleware/upload');
const { protectOptional } = require('../middleware/auth');

const router = express.Router();

// NOTE: These endpoints are intentionally PUBLIC (no required auth) so the
// frontend's AI Design Studio can call them without a JWT. protectOptional
// attaches req.user whenever a valid token IS present, so logged-in clients
// get their design history persisted and shown on their dashboard, while
// anonymous visitors can still use the feature.
// We still support multipart upload of a referenceImage via multer, but the
// primary contract is JSON { promptText, fileBlock }.
router.post('/', protectOptional, upload.single('referenceImage'), createDesign);
router.get('/', protectOptional, listDesigns);
router.get('/:id', protectOptional, getDesign);

module.exports = router;
