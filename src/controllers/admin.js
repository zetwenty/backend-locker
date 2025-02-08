const db = require('../config/firebase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'jaya_undip_123';

// Endpoint untuk menambahkan admin
const addAdmin = async (req, res) => {
    try {
        const { id_admin, username, password } = req.body;

        if (!id_admin || !username || !password) {
            return res.status(400).json({ message: 'Semua field harus diisi!' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await db.ref(`admin/${id_admin}`).set({
            username,
            password: hashedPassword
        });

        res.status(201).json({ message: 'Admin berhasil ditambahkan!' });
    } catch (error) {
        console.error('Error saat menambahkan admin:', error.message);
        res.status(500).json({ message: 'Terjadi kesalahan saat menambahkan admin.' });
    }
};

// Endpoint untuk login admin
const loginAdmin = async (req, res) => {
    const { username, password } = req.body;

    try {
        const snapshot = await db.ref('admin').orderByChild('username').equalTo(username).once('value');
        const adminData = snapshot.val();

        if (!adminData) {
            return res.status(404).json({ message: 'Admin tidak ditemukan!' });
        }

        const adminId = Object.keys(adminData)[0];
        const storedHashedPassword = adminData[adminId].password;

        const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Password salah!' });
        }

        const token = jwt.sign(
            { id: adminId, username: username },
            JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({ message: 'Login berhasil!', token });
    } catch (error) {
        console.error('Error saat login admin:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan semua admin
const getAllAdmins = async (req, res) => {
    try {
        const snapshot = await db.ref('admin').once('value');
        const data = snapshot.val();

        if (!data) {
            return res.status(404).json({ message: 'Tidak ada data admin ditemukan!' });
        }

        const adminData = Object.keys(data).map((key) => ({
            id_admin: key,
            username: data[key].username,
        }));

        res.status(200).json(adminData);
    } catch (error) {
        console.error('Error saat mengambil data admin:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk membuka kembali loker setelah 12 jam (Admin Only)
const unlockLocker = async (req, res) => {
    const { id_loker } = req.body;

    try {
        const lokerSnapshot = await db.ref(`locker/${id_loker}`).once('value');

        if (!lokerSnapshot.exists()) {
            return res.status(404).json({ message: 'Loker tidak ditemukan!' });
        }

        const activitiesSnapshot = await db.ref('activities').orderByChild('id_loker').equalTo(id_loker).once('value');
        if (!activitiesSnapshot.exists()) {
            return res.status(404).json({ message: 'Tidak ditemukan aktivitas terkait loker ini!' });
        }

        const activities = activitiesSnapshot.val();
        const lastActivityKey = Object.keys(activities).pop();
        const lastActivity = activities[lastActivityKey];
        const qr_code = lastActivity.qr_code;

        const waktuSelesaiISO = new Date().toISOString();
        await db.ref(`activities/${lastActivityKey}`).update({ waktu_selesai: waktuSelesaiISO });

        await db.ref(`qr_codes/${qr_code}`).set('available');

        await db.ref(`locker/${id_loker}`).update({
            status: 'available',
            waktu_mulai: null,
            waktu_selesai: null
        });

        res.status(200).json({ message: `Loker ${id_loker} berhasil dibuka kembali oleh admin! QR Code ${qr_code} telah direset menjadi "available".` });

    } catch (error) {
        console.error('Error unlocking locker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan daftar semua loker
const getAllLockersAdmin = async (req, res) => {
    try {
        const snapshot = await db.ref('locker').once('value');
        const lockers = snapshot.val();
        res.status(200).json(lockers);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mereset semua data di Firebase
const resetAllData = async (req, res) => {
    try {
        await db.ref('activities').remove();
        await db.ref('locker').remove();
        await db.ref('mahasiswa').remove();
        await db.ref('visitor').remove();
        await db.ref('qr_codes').remove();
        await db.ref('admin').remove();

        res.status(200).json({ message: 'Semua data berhasil direset!' });
    } catch (error) {
        console.error('Error resetting all data:', error.message);
        res.status(500).json({ error: 'Gagal mereset data!' });
    }
};

// Ekspor fungsi admin
module.exports = { addAdmin, loginAdmin, getAllAdmins, unlockLocker, getAllLockersAdmin, resetAllData };
