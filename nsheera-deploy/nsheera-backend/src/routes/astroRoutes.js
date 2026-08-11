const express = require('express');
const { createStoneSuggestion, listStoneSuggestions } = require('../controllers/astroController');
const { protectOptional } = require('../middleware/auth');

const router = express.Router();

// NOTE: These endpoints are intentionally PUBLIC (no required auth) so the
// frontend's Astro Stone Advisor can call them without a JWT. protectOptional
// attaches req.user whenever a valid token IS present, so logged-in clients
// get their suggestion history persisted and shown on their dashboard, while
// anonymous visitors can still use the feature.
router.post('/', protectOptional, createStoneSuggestion);
router.get('/', protectOptional, listStoneSuggestions);

module.exports = router;
