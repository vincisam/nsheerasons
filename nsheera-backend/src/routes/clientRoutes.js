const express = require('express');
const { getDashboard, getProfile, upsertProfile } = require('../controllers/clientController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Dashboard never requires/forces the profile form — see clientController.
router.get('/dashboard', getDashboard);

// Profile is fetched/edited only when the client explicitly visits Settings.
router.get('/profile', getProfile);
router.put('/profile', upsertProfile);

module.exports = router;
