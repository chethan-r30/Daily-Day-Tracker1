const express = require('express');
const router = express.Router();
const { getWhatsNew } = require('../controllers/whatsNewController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getWhatsNew);

module.exports = router;