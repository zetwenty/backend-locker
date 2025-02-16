const db = require('../config/firebase');

// Endpoint untuk menambahkan QR Code
const addQRCode = async (req, res) => {
    const qrList = req.body;

    try {
        if (!Array.isArray(qrList)) {
            return res.status(400).json({ message: 'Data harus berupa array!' });
        }

        let addedQRs = [];

        for (const qr of qrList) {
            const { qr_code, status } = qr;

            // Simpan ke Firebase
            await db.ref(`qr_codes/${qr_code}`).set(status);

            addedQRs.push(qr_code);
        }

        const message = addedQRs.length === 1
            ? `QR Code ${addedQRs[0]} berhasil ditambahkan!`
            : `QR Code ${addedQRs.join(', ')} berhasil ditambahkan!`;

        res.status(200).json({ message });
    } catch (error) {
        console.error('Error saat menambahkan QR Code:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan daftar QR Code yang tersedia
const getAvailableQRCodes = async (req, res) => {
    try {
        const qrSnapshot = await db.ref('qr_codes').orderByValue().equalTo('available').once('value');
        const availableQRs = qrSnapshot.val();

        if (!availableQRs) {
            return res.status(404).json({ message: 'Tidak ada QR Code yang tersedia!' });
        }

        res.status(200).json({ available_qr_codes: Object.keys(availableQRs) });
    } catch (error) {
        console.error('Error saat mengambil QR Code yang tersedia:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan semua QR Code yang terdaftar (baik available maupun in_use)
const getAllQRCodes = async (req, res) => {
    try {
        const qrSnapshot = await db.ref('qr_codes').once('value');
        const allQRs = qrSnapshot.val();

        if (!allQRs) {
            return res.status(404).json({ message: 'Tidak ada QR Code yang terdaftar!' });
        }

        // Format response agar semua QR Code terlihat beserta statusnya
        const qrList = Object.keys(allQRs).map(qr_code => ({
            qr_code,
            status: allQRs[qr_code]
        }));

        res.status(200).json(qrList);
    } catch (error) {
        console.error('Error saat mengambil semua QR Code:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};


// Endpoint untuk mereset status QR Code menjadi "available"
const resetQRCodes = async (req, res) => {
    const { ids } = req.body;

    try {
        if (!Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ message: 'Mohon masukkan QR Code yang ingin di-reset!' });
        }

        const failedResets = [];
        for (const qrCode of ids) {
            const snapshot = await db.ref(`qr_codes/${qrCode}`).once('value');

            if (!snapshot.exists() || snapshot.val() !== 'in_use') {
                failedResets.push(qrCode);
            } else {
                await db.ref(`qr_codes/${qrCode}`).set('available');
            }
        }

        if (failedResets.length > 0) {
            return res.status(404).json({ message: `QR Code ${failedResets.join(', ')} tidak ditemukan atau tidak dalam status "in_use"!` });
        }

        return res.status(200).json({ message: `QR Code ${ids.join(', ')} berhasil direset menjadi "available"!` });

    } catch (error) {
        console.error('Error saat mereset QR Code:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Ekspor semua fungsi terkait QR Code
module.exports = { addQRCode, getAvailableQRCodes, resetQRCodes, getAllQRCodes };