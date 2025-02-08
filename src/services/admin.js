const db = require('../config/firebase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'jaya_undip_123';

// Fungsi untuk menambahkan admin
const addAdmin = async ({ id_admin, username, password }) => {
    if (!id_admin || !username || !password) {
        throw new Error('Semua field harus diisi!');
    }

    // Enkripsi password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan data admin ke Firebase
    await db.ref(`admin/${id_admin}`).set({
        username,
        password: hashedPassword
    });

    return { message: 'Admin berhasil ditambahkan!' };
};

// Fungsi untuk login admin
const loginAdmin = async ({ username, password }) => {
    const snapshot = await db.ref('admin').orderByChild('username').equalTo(username).once('value');
    const adminData = snapshot.val();

    if (!adminData) {
        throw new Error('Admin tidak ditemukan!');
    }

    // Ambil data admin pertama yang cocok
    const adminId = Object.keys(adminData)[0];
    const storedHashedPassword = adminData[adminId].password;

    // Bandingkan password input dengan hash di database
    const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);

    if (!isPasswordValid) {
        throw new Error('Password salah!');
    }

    // Generate JWT Token
    const token = jwt.sign(
        { id: adminId, username },
        JWT_SECRET,
        { expiresIn: '1h' }
    );

    return { message: 'Login berhasil!', token };
};

// Fungsi untuk mendapatkan semua admin
const getAllAdmins = async () => {
    const snapshot = await db.ref('admin').once('value');
    const data = snapshot.val();

    if (!data) {
        throw new Error('Tidak ada data admin ditemukan!');
    }

    // Filter data untuk menghapus password dari respons
    return Object.keys(data).map((key) => ({
        id_admin: key,
        username: data[key].username,
    }));
};

module.exports = { addAdmin, loginAdmin, getAllAdmins };
