require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const db = require('./src/config/firebase');

// Import Middleware
const authenticateJWT = require('./src/middlewares/auth');
const validateLockerStatus = require('./src/middlewares/validateLocker');
const validateQRCode = require('./src/middlewares/validateQRCode');

// Import Routes (PASTIKAN SEMUA IMPORT ROUTES ADA DI ATAS SEBELUM `app.use`)
const adminRoutes = require('./src/routes/admin');
const mahasiswaRoutes = require('./src/routes/mahasiswa');
const visitorRoutes = require('./src/routes/visitor');
const lockerRoutes = require('./src/routes/locker');
const qrCodeRoutes = require('./src/routes/qrCode');
const activityRoutes = require('./src/routes/activity');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());

// Gunakan Routes
app.use('/api/admin', adminRoutes);
app.use('/api/mahasiswa', mahasiswaRoutes);
app.use('/api/visitor', visitorRoutes);
app.use('/api/locker', lockerRoutes);
app.use('/api/qr_codes', qrCodeRoutes);
app.use('/api/activities', activityRoutes);

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
