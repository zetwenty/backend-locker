const db = require('../config/firebase');

// Middleware untuk validasi status loker
const validateLockerStatus = async (req, res, next) => {
    const { id_loker } = req.body;

    try {
        // Cek status loker saat ini
        const lokerSnapshot = await db.ref(`locker/${id_loker}`).once('value');

        if (!lokerSnapshot.exists()) {
            return res.status(404).json({ message: 'Loker tidak ditemukan!' });
        }

        const lokerData = lokerSnapshot.val();
        const waktuSekarang = new Date();

        if (lokerData.status === 'in_use') {
            const waktuMulai = new Date(lokerData.waktu_mulai);
            const selisihJam = (waktuSekarang - waktuMulai) / (1000 * 60 * 60); // Konversi ke jam

            // Jika sudah lebih dari 12 jam, tampilkan pesan yang benar
            if (selisihJam > 12) {
                return res.status(403).json({ 
                    message: `Loker ${id_loker} telah digunakan lebih dari 12 jam! Silakan hubungi admin untuk membukanya kembali.` 
                });
            }

            // Jika masih kurang dari 12 jam, gunakan pesan standar
            return res.status(403).json({ message: 'Loker sudah digunakan, tidak dapat dibuka!' });
        }

        // Simpan data loker di request
        req.lokerData = lokerData;
        next(); // Lanjutkan ke proses pembukaan loker
    } catch (error) {
        console.error('Error validating locker status:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

module.exports = validateLockerStatus;
