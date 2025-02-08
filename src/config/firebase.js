const admin = require('firebase-admin');
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables

const serviceAccount = require('../../service-account-key.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL, // pakai .env 
});

const db = admin.database();
module.exports = db;
