const express = require('express');
const router = express.Router();
const lockerController = require('../controllers/locker');
const validateQRCode = require('../middlewares/validateQRCode');
const validateLockerStatus = require('../middlewares/validateLocker');

// Rute terkait Loker
router.post('/add', lockerController.addLocker);
router.get('/', lockerController.getAllLockers);
router.get('/status', lockerController.getLockerStatus);
router.post('/open', validateQRCode, validateLockerStatus, lockerController.openLocker);
router.post('/close', validateQRCode, lockerController.closeLocker);
router.delete('/delete/:id_loker', lockerController.deleteLocker);

module.exports = router;
