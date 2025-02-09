const lockerService = require('../services/locker');

// Controller untuk menambahkan loker
const addLocker = async (req, res) => {
    try {
        const response = await lockerService.addLocker(req.body);
        res.status(200).json(response);
    } catch (error) {
        console.error('Error saat menambahkan loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller untuk membuka loker
const openLocker = async (req, res) => {
    try {
        const response = await lockerService.openLocker({
            id_loker: req.body.id_loker,
            qr_code: req.body.qr_code,
            id_pengguna: req.id_pengguna,
            tipe_pengguna: req.tipe_pengguna
        });
        res.status(200).json(response);
    } catch (error) {
        console.error('Error saat membuka loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller untuk menutup loker
const closeLocker = async (req, res) => {
    try {
        const response = await lockerService.closeLocker({
            id_loker: req.body.id_loker,
            qr_code: req.body.qr_code
        });
        res.status(200).json(response);
    } catch (error) {
        console.error('Error saat menutup loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller untuk mendapatkan semua loker
const getAllLockers = async (req, res) => {
    try {
        const response = await lockerService.getAllLockers();
        res.status(200).json(response);
    } catch (error) {
        console.error('Error saat mengambil data loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller untuk mendapatkan status semua loker
const getLockerStatus = async (req, res) => {
    try {
        const response = await lockerService.getLockerStatus();
        res.status(200).json(response);
    } catch (error) {
        console.error('Error saat mengambil status loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller untuk membuka kembali loker setelah 12 jam
const unlockLocker = async (req, res) => {
    try {
        const response = await lockerService.unlockLocker(req.body.id_loker);
        res.status(200).json(response);
    } catch (error) {
        console.error('Error saat membuka loker oleh admin:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Controller untuk menghapus loker berdasarkan ID
const deleteLocker = async (req, res) => {
    try {
        const response = await lockerService.deleteLocker(req.params.id_loker);
        res.status(200).json(response);
    } catch (error) {
        console.error('Error saat menghapus loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = { addLocker, openLocker, closeLocker, getAllLockers, getLockerStatus, unlockLocker, deleteLocker };
