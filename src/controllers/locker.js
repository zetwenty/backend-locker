const db = require('../config/firebase');

// Endpoint untuk menambahkan loker
const addLocker = async (req, res) => {
    const lockers = req.body;

    try {
        if (!Array.isArray(lockers)) {
            return res.status(400).json({ message: 'Data harus berupa array!' });
        }

        let addedLockers = [];

        for (const locker of lockers) {
            const { id_loker, status, lokasi } = locker;

            // Validasi format ID loker
            if (!/^L\d+$/.test(id_loker)) {
                return res.status(400).json({ message: `ID Loker ${id_loker} harus dalam format LXXX (contoh: L001)` });
            }

            // Simpan ke Firebase
            await db.ref(`locker/${id_loker}`).set({ status, lokasi });

            addedLockers.push(id_loker);
        }

        const message = addedLockers.length === 1
            ? `Loker ${addedLockers[0]} berhasil ditambahkan!`
            : `Loker ${addedLockers.join(', ')} berhasil ditambahkan!`;

        res.status(200).json({ message });
    } catch (error) {
        console.error('Error saat menambahkan loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan semua loker
const getAllLockers = async (req, res) => {
    try {
        const snapshot = await db.ref('locker').once('value');
        const data = snapshot.val();

        if (!data) {
            return res.status(404).json({ message: 'Tidak ada loker ditemukan!' });
        }

        res.status(200).json(data);
    } catch (error) {
        console.error('Error saat mengambil data loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan status semua loker
const getLockerStatus = async (req, res) => {
    try {
        const snapshot = await db.ref('locker').once('value');
        const lockers = snapshot.val();

        if (!lockers) {
            return res.status(404).json({ message: 'Tidak ada data loker ditemukan!' });
        }

        const response = Object.keys(lockers).map((key) => ({
            id_loker: key,
            status: lockers[key].status,
            lokasi: lockers[key].lokasi,
        }));

        res.status(200).json(response);
    } catch (error) {
        console.error('Error saat mengambil status loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk membuka loker dengan validasi QR Code & batas waktu peminjaman
const openLocker = async (req, res) => {
    const { id_loker, qr_code } = req.body;
    const id_pengguna = req.id_pengguna;
    const tipe_pengguna = req.tipe_pengguna;

    try {
        const lokerSnapshot = await db.ref(`locker/${id_loker}`).once('value');

        if (!lokerSnapshot.exists()) {
            return res.status(404).json({ message: 'Loker tidak ditemukan!' });
        }

        const lokerData = lokerSnapshot.val();
        const waktuSekarang = new Date();

        if (lokerData.status === 'in_use') {
            return res.status(403).json({ message: 'Loker sudah digunakan, tidak dapat dibuka!' });
        }

        await db.ref(`qr_codes/${qr_code}`).set('in_use');

        const waktuSekarangISO = waktuSekarang.toISOString();
        const activityId = `A${Date.now()}`;

        await db.ref(`activities/${activityId}`).set({
            id_pengguna,
            tipe_pengguna,
            qr_code,
            id_loker,
            waktu_mulai: waktuSekarangISO,
            waktu_selesai: null
        });

        await db.ref(`locker/${id_loker}`).update({
            status: 'in_use',
            waktu_mulai: waktuSekarangISO,
        });

        res.status(200).json({ 
            message: `Loker ${id_loker} berhasil dibuka oleh pengguna ${id_pengguna}!`, 
            waktu_mulai: waktuSekarangISO 
        });

    } catch (error) {
        console.error('Error saat membuka loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk menutup loker
const closeLocker = async (req, res) => {
    const { id_loker, qr_code } = req.body;
    const waktuSelesaiISO = new Date().toISOString();

    try {
        const lokerSnapshot = await db.ref(`locker/${id_loker}`).once('value');

        if (!lokerSnapshot.exists()) {
            return res.status(404).json({ message: 'Loker tidak ditemukan!' });
        }

        await db.ref('activities').orderByChild('qr_code').equalTo(qr_code).once('value')
            .then(snapshot => {
                if (!snapshot.exists()) {
                    return res.status(404).json({ message: 'Tidak ditemukan aktivitas terkait QR Code ini!' });
                }

                const activities = snapshot.val();
                const lastActivityKey = Object.keys(activities).pop();

                db.ref(`activities/${lastActivityKey}`).update({
                    waktu_selesai: waktuSelesaiISO
                });
            });

        await db.ref(`qr_codes/${qr_code}`).set('available');

        await db.ref(`locker/${id_loker}`).update({
            status: 'available',
            waktu_mulai: null,
            waktu_selesai: waktuSelesaiISO
        });

        res.status(200).json({ message: `Loker ${id_loker} berhasil ditutup!` });

    } catch (error) {
        console.error('Error saat menutup loker:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk menghapus loker berdasarkan ID
const deleteLocker = async (req, res) => {
    const { id_loker } = req.params;

    try {
        const lokerSnapshot = await db.ref(`locker/${id_loker}`).once('value');

        if (!lokerSnapshot.exists()) {
            return res.status(404).json({ message: 'Loker tidak ditemukan!' });
        }

        await db.ref(`locker/${id_loker}`).remove();

        res.status(200).json({ message: `Loker ${id_loker} berhasil dihapus.` });
    } catch (error) {
        console.error('Error saat menghapus loker:', error.message);
        res.status(500).json({ error: 'Terjadi kesalahan dalam menghapus loker' });
    }
};

// Ekspor semua fungsi terkait loker
module.exports = { 
    addLocker, 
    getAllLockers, 
    getLockerStatus, 
    openLocker, 
    closeLocker, 
    deleteLocker 
};
