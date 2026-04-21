const express = require('express');
const router = express.Router();
const santriController = require('../controllers/santriController');

router.get('/', santriController.searchSantri);

module.exports = router;