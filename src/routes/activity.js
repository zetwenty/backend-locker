const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activity');

// Rute untuk mencatat log aktivitas loker ketika visitor atau mahasiswa scan QR Code
router.post('/log', activityController.logActivity);

// Rute untuk mendapatkan semua aktivitas berdasarkan filter QR Code atau rentang waktu
router.get('/', activityController.getAllActivities);

// Rute untuk memperbarui data aktivitas tertentu
router.post('/update', activityController.updateActivity);

module.exports = router;
