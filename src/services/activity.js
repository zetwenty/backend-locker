const db = require('../config/firebase');

// Fungsi untuk mencatat aktivitas loker
const logActivity = async ({ qr_code, id_loker, waktu_mulai, waktu_selesai }) => {
    if (!qr_code || !id_loker || !waktu_mulai || !waktu_selesai) {
        throw new Error('Data aktivitas tidak lengkap!');
    }

    const activityId = `A${Date.now()}`;
    await db.ref(`activities/${activityId}`).set({ qr_code, id_loker, waktu_mulai, waktu_selesai });

    return { message: 'Aktivitas berhasil dicatat.', activityId };
};

// Ekspor semua fungsi terkait aktivitas
module.exports = { logActivity };
