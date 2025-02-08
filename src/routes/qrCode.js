const express = require('express');
const router = express.Router();
const qrCodeController = require('../controllers/qrCode');

// Rute terkait QR Code
router.post('/add', qrCodeController.addQRCode);
router.get('/available', qrCodeController.getAvailableQRCodes);
router.post('/reset', qrCodeController.resetQRCodes);

module.exports = router;
