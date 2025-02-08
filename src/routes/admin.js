const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin');
const authenticateJWT = require('../middlewares/auth');

// Rute untuk admin
router.post('/add', adminController.addAdmin);
router.post('/login', adminController.loginAdmin);
router.get('/', authenticateJWT, adminController.getAllAdmins);
router.post('/unlock-locker', authenticateJWT, adminController.unlockLocker);
router.get('/lockers', authenticateJWT, adminController.getAllLockersAdmin);
router.delete('/reset-all', authenticateJWT, adminController.resetAllData); // Perbaikan ini!

module.exports = router;
