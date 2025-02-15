const db = require('../config/firebase');

// Endpoint untuk mencatat log aktivitas loker ketika visitor atau mahasiswa scan QR Code
const logActivity = async (req, res) => {
    const { qr_code, id_loker, waktu_mulai, waktu_selesai } = req.body;

    if (!qr_code || !id_loker || !waktu_mulai || !waktu_selesai) {
        return res.status(400).json({ message: 'Data aktivitas tidak lengkap!' });
    }

    try {
        // Validasi QR Code
        const qrSnapshot = await db.ref(`qr_codes/${qr_code}`).once('value');
        if (!qrSnapshot.exists() || qrSnapshot.val() !== 'in_use') {
            return res.status(400).json({ message: 'QR Code tidak valid atau tidak sedang digunakan!' });
        }

        // Cari nama berdasarkan QR Code
        let nama = '';
        
        // Cek apakah QR Code adalah NIM mahasiswa
        const mahasiswaSnapshot = await db.ref('mahasiswa')
            .orderByChild('nim')
            .equalTo(qr_code)
            .once('value');
        
        if (mahasiswaSnapshot.exists()) {
            const mahasiswaData = mahasiswaSnapshot.val();
            const firstKey = Object.keys(mahasiswaData)[0];
            nama = mahasiswaData[firstKey].nama;
        } 
        // Jika bukan NIM, cek sebagai QR visitor
        else {
            const visitorSnapshot = await db.ref('visitor')
                .orderByChild('qr_code')
                .equalTo(qr_code)
                .once('value');
            
            if (visitorSnapshot.exists()) {
                const visitorData = visitorSnapshot.val();
                const firstKey = Object.keys(visitorData)[0];
                nama = visitorData[firstKey].nama;
            } else {
                return res.status(400).json({ message: 'QR Code tidak terdaftar!' });
            }
        }

        const activityId = `A${Date.now()}`;

        // Simpan aktivitas dengan nama
        await db.ref(`activities/${activityId}`).set({
            qr_code,
            id_loker,
            waktu_mulai,
            waktu_selesai,
            nama // Tambahkan field nama
        });

        await db.ref(`qr_codes/${qr_code}`).set('available');
        res.status(201).json({ message: 'Aktivitas berhasil dicatat.', activityId });
    } catch (error) {
        console.error('Error logging activity:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan laporan aktivitas berdasarkan QR Code atau rentang waktu
const getAllActivities = async (req, res) => {
    const { qr_code, start_time, end_time } = req.query;

    try {
        // Ambil semua aktivitas dari Firebase
        const snapshot = await db.ref('activities').once('value');
        const activities = snapshot.val();

        if (!activities) {
            return res.status(404).json({ message: 'Tidak ada aktivitas ditemukan!' });
        }

        let filteredActivities = Object.values(activities);

        // Filter aktivitas berdasarkan QR Code (opsional)
        if (qr_code) {
            filteredActivities = filteredActivities.filter(activity => activity.qr_code === qr_code);
        }

        // Filter aktivitas berdasarkan rentang waktu (opsional)
        if (start_time && end_time) {
            const start = new Date(start_time);
            const end = new Date(end_time);

            if (isNaN(start) || isNaN(end)) {
                return res.status(400).json({ message: 'Format waktu tidak valid! Gunakan format YYYY-MM-DDTHH:mm:ssZ' });
            }

            filteredActivities = filteredActivities.filter(activity => {
                const mulai = new Date(activity.waktu_mulai);
                const selesai = new Date(activity.waktu_selesai);

                return mulai >= start && selesai <= end;
            });
        }

        res.status(200).json(filteredActivities);
    } catch (error) {
        console.error('Error fetching activities:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk memperbarui data aktivitas tertentu
const updateActivity = async (req, res) => {
    const { activity_id, ...updates } = req.body;

    try {
        // Cek apakah aktivitas tersedia di Firebase
        const activitySnapshot = await db.ref(`activities/${activity_id}`).once('value');

        if (!activitySnapshot.exists()) {
            return res.status(404).json({ message: 'Aktivitas tidak ditemukan!' });
        }

        // Pastikan ada data yang ingin diperbarui
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: 'Tidak ada data yang diberikan untuk update!' });
        }

        // Konversi `null` ke string "null" agar tetap tersimpan di Firebase
        Object.keys(updates).forEach(key => {
            if (updates[key] === null) {
                updates[key] = "null";
            }
        });

        // Update hanya atribut yang diberikan dalam request body
        await db.ref(`activities/${activity_id}`).update(updates);

        res.status(200).json({ message: 'Aktivitas berhasil diperbarui!' });
    } catch (error) {
        console.error('Error updating activity:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Ekspor semua fungsi terkait aktivitas
module.exports = { logActivity, getAllActivities, updateActivity };
