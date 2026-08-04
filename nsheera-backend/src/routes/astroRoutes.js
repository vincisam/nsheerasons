const express = require('express');
const { createStoneSuggestion, listStoneSuggestions } = require('../controllers/astroController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Allow public AI stone suggestions from the client dashboard.
router.post('/', createStoneSuggestion);

// Listing saved suggestions requires authentication.
router.use(protect);
router.get('/', listStoneSuggestions);

module.exports = router;
