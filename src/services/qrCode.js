const db = require('../config/firebase');

// Fungsi untuk menambahkan QR Code
const addQRCode = async (qrList) => {
    if (!Array.isArray(qrList)) {
        throw new Error('Data harus berupa array!');
    }

    let addedQRs = [];
    for (const qr of qrList) {
        const { qr_code, status } = qr;
        await db.ref(`qr_codes/${qr_code}`).set(status);
        addedQRs.push(qr_code);
    }

    return {
        message: addedQRs.length === 1
            ? `QR Code ${addedQRs[0]} berhasil ditambahkan!`
            : `QR Code ${addedQRs.join(', ')} berhasil ditambahkan!`
    };
};

// Fungsi untuk mendapatkan daftar QR Code yang tersedia
const getAvailableQRCodes = async () => {
    const snapshot = await db.ref('qr_codes').orderByValue().equalTo('available').once('value');
    const availableQRs = snapshot.val();

    if (!availableQRs) {
        throw new Error('Tidak ada QR Code yang tersedia!');
    }

    return Object.keys(availableQRs);
};

// Fungsi untuk mereset QR Code menjadi tersedia
const resetQRCode = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Mohon masukkan QR Code yang ingin di-reset!');
    }

    let failedResets = [];
    for (const qrCode of ids) {
        const snapshot = await db.ref(`qr_codes/${qrCode}`).once('value');

        if (!snapshot.exists() || snapshot.val() !== 'in_use') {
            failedResets.push(qrCode);
        } else {
            await db.ref(`qr_codes/${qrCode}`).set('available');
        }
    }

    if (failedResets.length > 0) {
        throw new Error(`QR Code ${failedResets.join(', ')} tidak ditemukan atau tidak dalam status "in_use"!`);
    }

    return { message: `QR Code ${ids.join(', ')} berhasil direset menjadi "available"!` };
};

// Ekspor semua fungsi terkait QR Code
module.exports = { addQRCode, getAvailableQRCodes, resetQRCode };
