const db = require('../config/firebase');

// Fungsi untuk mendaftarkan visitor
const registerVisitor = async (visitors) => {
    if (!Array.isArray(visitors)) {
        throw new Error('Data harus berupa array!');
    }

    let addedVisitors = [];
    for (const visitor of visitors) {
        const { id_visitor, nama, instansi, qr_code } = visitor;

        if (!id_visitor || !nama || !instansi || !qr_code) {
            throw new Error('ID Visitor, Nama, Instansi, dan QR Code harus diisi!');
        }

        const qrSnapshot = await db.ref(`qr_codes/${qr_code}`).once('value');
        if (!qrSnapshot.exists() || qrSnapshot.val() !== 'available') {
            throw new Error(`QR Code ${qr_code} tidak tersedia atau sudah digunakan!`);
        }

        await db.ref(`visitor/${id_visitor}`).set({ nama, instansi, qr_code });
        await db.ref(`qr_codes/${qr_code}`).set('in_use');
        addedVisitors.push(nama);
    }

    return {
        message: addedVisitors.length === 1
            ? `Visitor ${addedVisitors[0]} berhasil didaftarkan!`
            : `Visitor ${addedVisitors.join(', ')} berhasil didaftarkan!`
    };
};

// Fungsi untuk mendapatkan semua visitor
const getAllVisitors = async () => {
    const snapshot = await db.ref('visitor').once('value');
    const visitors = snapshot.val();

    if (!visitors) {
        throw new Error('Tidak ada visitor ditemukan!');
    }

    return visitors;
};

// Fungsi untuk mendapatkan detail visitor berdasarkan QR Code
const getVisitorByQRCode = async (qr_code) => {
    const snapshot = await db.ref('visitor').orderByChild('qr_code').equalTo(qr_code).once('value');
    if (!snapshot.exists()) {
        throw new Error('Visitor tidak ditemukan untuk QR Code ini!');
    }

    const visitorData = snapshot.val();
    return Object.values(visitorData)[0];
};

// Fungsi untuk menghapus visitor
const deleteVisitors = async (ids) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Mohon masukkan ID visitor yang ingin dihapus!');
    }

    let failedDeletes = [];
    for (const visitorId of ids) {
        const snapshot = await db.ref(`visitor/${visitorId}`).once('value');

        if (!snapshot.exists()) {
            failedDeletes.push(visitorId);
        } else {
            await db.ref(`visitor/${visitorId}`).remove();
        }
    }

    if (failedDeletes.length > 0) {
        throw new Error(`Visitor ${failedDeletes.join(', ')} tidak ditemukan!`);
    }

    return { message: `Visitor ${ids.join(', ')} berhasil dihapus!` };
};

// Ekspor semua fungsi terkait visitor
module.exports = { registerVisitor, getAllVisitors, getVisitorByQRCode, deleteVisitors };
