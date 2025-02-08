const db = require('../config/firebase');

// Fungsi untuk menambahkan loker
const addLocker = async (lockers) => {
    if (!Array.isArray(lockers)) {
        throw new Error('Data harus berupa array!');
    }

    let addedLockers = [];
    for (const locker of lockers) {
        const { id_loker, status, lokasi } = locker;

        if (!/^L\d+$/.test(id_loker)) {
            throw new Error(`ID Loker ${id_loker} harus dalam format LXXX (contoh: L001)`);
        }

        await db.ref(`locker/${id_loker}`).set({ status, lokasi });
        addedLockers.push(id_loker);
    }

    return {
        message: addedLockers.length === 1
            ? `Loker ${addedLockers[0]} berhasil ditambahkan!`
            : `Loker ${addedLockers.join(', ')} berhasil ditambahkan!`
    };
};

// Fungsi untuk mendapatkan semua loker
const getAllLockers = async () => {
    const snapshot = await db.ref('locker').once('value');
    const lockers = snapshot.val();

    if (!lockers) {
        throw new Error('Tidak ada loker ditemukan!');
    }

    return lockers;
};

// Fungsi untuk menghapus loker berdasarkan ID
const deleteLocker = async (id_loker) => {
    const snapshot = await db.ref(`locker/${id_loker}`).once('value');

    if (!snapshot.exists()) {
        throw new Error('Loker tidak ditemukan!');
    }

    await db.ref(`locker/${id_loker}`).remove();
    return { message: `Loker ${id_loker} berhasil dihapus.` };
};

// Ekspor semua fungsi terkait loker
module.exports = { addLocker, getAllLockers, deleteLocker };
