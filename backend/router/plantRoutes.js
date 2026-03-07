const express = require('express');
const plantController = require('../controller/plantController');
const validateImage = require('../middleware/validateImage');

const router = express.Router();

router.post('/analyze', validateImage, plantController.analyze);

module.exports = router;