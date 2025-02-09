const db = require('../config/firebase');

// Middleware untuk validasi QR Code
const validateQRCode = async (req, res, next) => {
    const { qr_code } = req.body;

    try {
        let id_pengguna = null;
        let tipe_pengguna = null;

        // Cek apakah QR Code adalah NIM Mahasiswa
        const mahasiswaSnapshot = await db.ref('mahasiswa').orderByChild('nim').equalTo(qr_code).once('value');
        if (mahasiswaSnapshot.exists()) {
            const mahasiswaData = mahasiswaSnapshot.val();
            const id_mahasiswa = Object.keys(mahasiswaData)[0]; // Ambil ID Mahasiswa dari database

            id_pengguna = id_mahasiswa;
            tipe_pengguna = 'mahasiswa';
        }

        // Cek apakah QR Code adalah Visitor
        if (!id_pengguna) {
            const visitorSnapshot = await db.ref('visitor').orderByChild('qr_code').equalTo(qr_code).once('value');
            if (visitorSnapshot.exists()) {
                const visitorData = visitorSnapshot.val();
                const id_visitor = Object.keys(visitorData)[0]; // Ambil ID Visitor dari database
                
                id_pengguna = id_visitor;
                tipe_pengguna = 'visitor';
            }
        }

        // Jika QR Code tidak ditemukan
        if (!id_pengguna) {
            return res.status(400).json({ message: 'QR Code tidak valid!' });
        }

        // Simpan id_pengguna & tipe_pengguna dalam request agar bisa digunakan di controller
        req.id_pengguna = id_pengguna;
        req.tipe_pengguna = tipe_pengguna;
        next();
    } catch (error) {
        console.error('Error validating QR Code:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = validateQRCode;
