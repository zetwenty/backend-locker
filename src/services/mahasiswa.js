const db = require('../config/firebase');

// Fungsi untuk menambahkan mahasiswa
const addMahasiswa = async (mahasiswaList) => {
    if (!Array.isArray(mahasiswaList)) {
        throw new Error('Data harus berupa array!');
    }

    let addedNames = [];

    for (const mahasiswa of mahasiswaList) {
        const { id_mahasiswa, nim, nama } = mahasiswa;

        await db.ref(`mahasiswa/${id_mahasiswa}`).set({ nim, nama });

        addedNames.push(nama);
    }

    return {
        message: addedNames.length === 1
            ? `Mahasiswa ${addedNames[0]} berhasil ditambahkan!`
            : `Mahasiswa ${addedNames.join(', ')} berhasil ditambahkan!`
    };
};

// Fungsi untuk memperbarui data mahasiswa
const updateMahasiswa = async ({ id_mahasiswa, nim, nama }) => {
    if (!id_mahasiswa || !nim || !nama) {
        throw new Error('ID, NIM, dan Nama harus diisi!');
    }

    const snapshot = await db.ref('mahasiswa').orderByChild('nim').equalTo(nim).once('value');

    if (!snapshot.exists()) {
        throw new Error('Mahasiswa dengan NIM ini tidak ditemukan!');
    }

    await db.ref(`mahasiswa/${id_mahasiswa}`).update({ nim, nama });

    return { message: 'Data mahasiswa berhasil diperbarui' };
};

// Fungsi untuk mendapatkan semua mahasiswa
const getAllMahasiswa = async () => {
    const snapshot = await db.ref('mahasiswa').once('value');
    const mahasiswa = snapshot.val();

    if (!mahasiswa) {
        throw new Error('Tidak ada mahasiswa ditemukan!');
    }

    return mahasiswa;
};

// Fungsi untuk mendapatkan mahasiswa berdasarkan NIM
const getMahasiswaByNIM = async (nim) => {
    const snapshot = await db.ref('mahasiswa').orderByChild('nim').equalTo(nim).once('value');

    if (!snapshot.exists()) {
        throw new Error('Mahasiswa tidak ditemukan!');
    }

    const studentData = snapshot.val();
    return Object.keys(studentData).map((key) => ({
        id_mahasiswa: key,
        ...studentData[key]
    }))[0];
};

module.exports = { addMahasiswa, updateMahasiswa, getAllMahasiswa, getMahasiswaByNIM };
