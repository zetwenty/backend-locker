const express = require('express');
const router = express.Router();
const mahasiswaController = require('../controllers/mahasiswa');

// Rute terkait Mahasiswa
router.post('/add', mahasiswaController.addMahasiswa);
router.put('/update', mahasiswaController.updateMahasiswa);
router.get('/', mahasiswaController.getAllMahasiswa);
router.get('/details/:nim', mahasiswaController.getMahasiswaByNIM);

module.exports = router;
