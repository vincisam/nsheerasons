const express = require('express');
const { createStoneSuggestion, listStoneSuggestions } = require('../controllers/astroController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.post('/', createStoneSuggestion);
router.get('/', listStoneSuggestions);

module.exports = router;
