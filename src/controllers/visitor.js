const db = require('../config/firebase');

// Endpoint untuk mendaftarkan visitor dengan validasi QR Code
const registerVisitor = async (req, res) => {
    const visitors = req.body;

    try {
        if (!Array.isArray(visitors)) {
            return res.status(400).json({ message: 'Data harus berupa array!' });
        }

        let addedVisitors = [];

        for (const visitor of visitors) {
            const { id_visitor, nama, instansi, qr_code } = visitor;

            // Validasi input
            if (!id_visitor || !nama || !instansi || !qr_code) {
                return res.status(400).json({ message: 'ID Visitor, Nama, Instansi, dan QR Code harus diisi!' });
            }

            // Cek apakah QR Code masih tersedia
            const qrSnapshot = await db.ref(`qr_codes/${qr_code}`).once('value');
            if (!qrSnapshot.exists() || qrSnapshot.val() !== 'available') {
                return res.status(400).json({ message: `QR Code ${qr_code} tidak tersedia atau sudah digunakan!` });
            }

            // Simpan data visitor ke database
            await db.ref(`visitor/${id_visitor}`).set({
                nama,
                instansi,
                qr_code,
            });

            // Ubah status QR Code menjadi "in_use"
            await db.ref(`qr_codes/${qr_code}`).set('in_use');

            addedVisitors.push(nama);
        }

        const message = addedVisitors.length === 1
            ? `Visitor ${addedVisitors[0]} berhasil didaftarkan!`
            : `Visitor ${addedVisitors.join(', ')} berhasil didaftarkan!`;

        res.status(201).json({ message });
    } catch (error) {
        console.error('Error saat mendaftarkan visitor:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan semua visitor
const getAllVisitors = async (req, res) => {
    try {
        const snapshot = await db.ref('visitor').once('value');
        const visitor = snapshot.val();

        if (!visitor) {
            return res.status(404).json({ message: 'Tidak ada visitor ditemukan!' });
        }

        res.status(200).json(visitor);
    } catch (error) {
        console.error('Error saat mengambil data visitor:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan detail visitor berdasarkan QR Code
const getVisitorDetails = async (req, res) => {
    const { qr_code } = req.params;

    try {
        const visitorSnapshot = await db.ref('visitor').orderByChild('qr_code').equalTo(qr_code).once('value');
        if (!visitorSnapshot.exists()) {
            return res.status(404).json({ message: 'Visitor tidak ditemukan untuk QR Code ini!' });
        }

        const visitorData = visitorSnapshot.val();
        const visitor = Object.values(visitorData)[0];

        res.status(200).json(visitor);
    } catch (error) {
        console.error('Error saat mengambil detail visitor:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk menghapus visitor berdasarkan ID
const deleteVisitors = async (req, res) => {
    const { ids } = req.body;

    try {
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Mohon masukkan ID visitor yang ingin dihapus!' });
        }

        const failedDeletes = [];
        for (const visitorId of ids) {
            const snapshot = await db.ref(`visitor/${visitorId}`).once('value');

            if (!snapshot.exists()) {
                failedDeletes.push(visitorId);
            } else {
                await db.ref(`visitor/${visitorId}`).remove();
            }
        }

        if (failedDeletes.length > 0) {
            return res.status(404).json({ message: `Visitor ${failedDeletes.join(', ')} tidak ditemukan!` });
        }

        return res.status(200).json({ message: `Visitor ${ids.join(', ')} berhasil dihapus!` });

    } catch (error) {
        console.error('Error saat menghapus visitor:', error.message);
        res.status(500).json({ message: 'Terjadi kesalahan dalam menghapus visitor' });
    }
};

// Ekspor semua fungsi terkait visitor
module.exports = { registerVisitor, getAllVisitors, getVisitorDetails, deleteVisitors };
