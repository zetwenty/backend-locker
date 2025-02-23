const db = require('../config/firebase');

// Fungsi untuk mendapatkan nama pengguna berdasarkan tipe pengguna
const getNamaPengguna = async (id_pengguna, tipe_pengguna) => {
    if (tipe_pengguna === 'mahasiswa') {
        const mahasiswaSnapshot = await db.ref(`mahasiswa/${id_pengguna}`).once('value');
        if (mahasiswaSnapshot.exists()) {
            return mahasiswaSnapshot.val().nama;
        }
    } else if (tipe_pengguna === 'visitor') {
        const visitorSnapshot = await db.ref(`visitor/${id_pengguna}`).once('value');
        if (visitorSnapshot.exists()) {
            return visitorSnapshot.val().nama;
        }
    }
    return 'Pengguna Tidak Diketahui';
};

// Fungsi untuk membuka loker
const openLocker = async ({ id_loker, qr_code, id_pengguna, tipe_pengguna }) => {
    const activeLockerSnapshot = await db.ref('activities')
        .orderByChild('qr_code')
        .equalTo(qr_code)
        .once('value');

    if (activeLockerSnapshot.exists()) {
        const activities = activeLockerSnapshot.val();
        const lastActivityKey = Object.keys(activities).pop();
        const lastActivity = activities[lastActivityKey];

        if (!lastActivity.waktu_selesai) {
            return { 
                status: 400, 
                message: `${qr_code} - ${lastActivity.nama} sedang menggunakan loker ${lastActivity.id_loker}, tidak bisa membuka loker lain!` 
            };
        }
    }

    const lokerSnapshot = await db.ref(`locker/${id_loker}`).once('value');
    if (!lokerSnapshot.exists()) {
        throw new Error('Loker tidak ditemukan!');
    }

    const lokerData = lokerSnapshot.val();
    const nama_pengguna = await getNamaPengguna(id_pengguna, tipe_pengguna);

    if (lokerData.status === 'in_use') {
        throw new Error(`Loker ${id_loker} sedang digunakan, tidak dapat dibuka!`);
    }

    const waktuMulaiISO = new Date().toISOString();
    const activityId = `A${Date.now()}`;

    await db.ref(`activities/${activityId}`).set({
        id_pengguna,
        tipe_pengguna,
        qr_code,
        id_loker,
        waktu_mulai: waktuMulaiISO,
        waktu_selesai: null,
        nama: nama_pengguna
    });

    await db.ref(`locker/${id_loker}`).update({
        status: 'in_use',
        waktu_mulai: waktuMulaiISO
    });

    await db.ref(`qr_codes/${qr_code}`).set('in_use');

    await db.ref(`locker/${id_loker}/relay`).set(true);

    return { message: `Loker ${id_loker} berhasil dibuka oleh ${tipe_pengguna} - ${nama_pengguna}!`, waktu_mulai: waktuMulaiISO };
};




// Fungsi untuk menutup loker
const closeLocker = async ({ qr_code }) => {
    try {
        const waktuSelesaiISO = new Date().toISOString();

        const activitySnapshot = await db.ref('activities').orderByChild('qr_code').equalTo(qr_code).once('value');
        if (!activitySnapshot.exists()) {
            return { status: 400, message: `Tidak ditemukan aktivitas terkait QR Code ${qr_code}!` };
        }

        const activities = activitySnapshot.val();
        const lastActivityKey = Object.keys(activities).pop();
        const lastActivity = activities[lastActivityKey];
        const id_loker = lastActivity.id_loker;

        if (!id_loker) {
            return { status: 400, message: `Loker tidak ditemukan untuk QR Code ${qr_code}!` };
        }

        const lokerSnapshot = await db.ref(`locker/${id_loker}`).once('value');
        if (!lokerSnapshot.exists()) {
            return { status: 404, message: `Loker ${id_loker} tidak ditemukan!` };
        }

        const lokerData = lokerSnapshot.val();
        const waktuSekarang = new Date();

        const waktuMulai = new Date(lokerData.waktu_mulai);
        const selisihJam = (waktuSekarang - waktuMulai) / (1000 * 60 * 60);

        if (selisihJam > 12) {
            return { status: 403, message: `Loker ${id_loker} telah digunakan lebih dari 12 jam! Silakan hubungi admin untuk membukanya kembali.` };
        }

        await db.ref(`locker/${id_loker}/relay`).set(true);

        await db.ref(`activities/${lastActivityKey}`).update({
            waktu_selesai: waktuSelesaiISO
        });

        await db.ref(`qr_codes/${qr_code}`).set('available');

        await db.ref(`locker/${id_loker}`).update({
            status: 'available',
            waktu_mulai: null
        });

        return { status: 200, message: `Loker ${id_loker} berhasil dibuka untuk pengambilan barang oleh ${lastActivity.tipe_pengguna} - ${lastActivity.nama}, setelah itu akan menutup otomatis sesuai kondisi ESP32!` };

    } catch (error) {
        console.error('Error saat menutup loker:', error.message);
        return { status: 500, message: `Terjadi kesalahan: ${error.message}` };
    }
};

// Fungsi untuk membuka kembali loker setelah 12 jam oleh admin
const unlockLocker = async (id_loker) => {
    const activitiesSnapshot = await db.ref('activities').orderByChild('id_loker').equalTo(id_loker).once('value');

    if (!activitiesSnapshot.exists()) {
        throw new Error(`Tidak ditemukan aktivitas terkait loker ${id_loker}!`);
    }

    const activities = activitiesSnapshot.val();
    const lastActivityKey = Object.keys(activities).pop();
    const lastActivity = activities[lastActivityKey];
    const qr_code = lastActivity.qr_code;

    // Reset QR Code menjadi "available"
    await db.ref(`qr_codes/${qr_code}`).set('available');

    // Ubah status loker menjadi "available"
    await db.ref(`locker/${id_loker}`).update({ status: 'available', waktu_mulai: null });

    return { message: `Loker ${id_loker} berhasil dibuka kembali oleh admin!` };
};

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

        await db.ref(`locker/${id_loker}`).set({
            status,
            lokasi,
            relay: false
        });

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

// Fungsi untuk mendapatkan status loker
const getLockerStatus = async () => {
    const snapshot = await db.ref('locker').once('value');
    const lockers = snapshot.val();

    if (!lockers) {
        throw new Error('Tidak ada data loker ditemukan!');
    }

    return Object.keys(lockers).map((key) => ({
        id_loker: key,
        status: lockers[key].status,
        lokasi: lockers[key].lokasi
    }));
};

// Fungsi untuk menghapus loker
const deleteLocker = async (id_loker) => {
    const snapshot = await db.ref(`locker/${id_loker}`).once('value');

    if (!snapshot.exists()) {
        throw new Error('Loker tidak ditemukan!');
    }

    await db.ref(`locker/${id_loker}`).remove();
    return { message: `Loker ${id_loker} berhasil dihapus.` };
};

module.exports = { addLocker, openLocker, closeLocker, getAllLockers, getLockerStatus, unlockLocker, deleteLocker };
