const db = require('../config/firebase');

// Endpoint untuk menambahkan banyak mahasiswa
const addMahasiswa = async (req, res) => {
    const mahasiswaList = req.body;

    try {
        if (!Array.isArray(mahasiswaList)) {
            return res.status(400).json({ message: 'Data harus berupa array!' });
        }

        let addedNames = [];

        for (const mahasiswa of mahasiswaList) {
            const { id_mahasiswa, nim, nama } = mahasiswa;

            await db.ref(`mahasiswa/${id_mahasiswa}`).set({ nim, nama });

            addedNames.push(nama);
        }

        res.status(200).json({ message: `Mahasiswa ${addedNames.join(', ')} berhasil ditambahkan!` });
    } catch (error) {
        console.error('Error saat menambahkan mahasiswa:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk memperbarui mahasiswa
const updateMahasiswa = async (req, res) => {
    const { id_mahasiswa, nim, nama } = req.body;

    if (!id_mahasiswa || !nim || !nama) {
        return res.status(400).json({ message: 'ID, NIM, dan Nama harus diisi!' });
    }

    try {
        const snapshot = await db.ref('mahasiswa').orderByChild('nim').equalTo(nim).once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ message: 'Mahasiswa dengan NIM ini tidak ditemukan!' });
        }

        await db.ref(`mahasiswa/${id_mahasiswa}`).update({ nim, nama });

        res.status(200).json({ message: 'Data mahasiswa berhasil diperbarui' });
    } catch (error) {
        console.error('Error saat memperbarui mahasiswa:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan semua mahasiswa
const getAllMahasiswa = async (req, res) => {
    try {
        const snapshot = await db.ref('mahasiswa').once('value');
        const mahasiswa = snapshot.val();

        if (!mahasiswa) {
            return res.status(404).json({ message: 'Tidak ada mahasiswa ditemukan!' });
        }

        res.status(200).json(mahasiswa);
    } catch (error) {
        console.error('Error saat mengambil data mahasiswa:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Endpoint untuk mendapatkan detail mahasiswa berdasarkan NIM
const getMahasiswaByNIM = async (req, res) => {
    const nim = req.params.nim;

    try {
        const snapshot = await db.ref('mahasiswa').orderByChild('nim').equalTo(nim).once('value');

        if (!snapshot.exists()) {
            return res.status(404).json({ message: 'Mahasiswa tidak ditemukan!' });
        }

        const studentData = snapshot.val();
        const response = Object.keys(studentData).map((key) => ({
            id_mahasiswa: key,
            ...studentData[key]
        }));

        res.status(200).json(response[0]);
    } catch (error) {
        console.error('Error saat mengambil detail mahasiswa:', error.message);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Pastikan semua fungsi diekspor dengan benar
module.exports = { addMahasiswa, updateMahasiswa, getAllMahasiswa, getMahasiswaByNIM };
