const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'jaya_undip_123';

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Token tidak ditemukan!" });
    }

    const token = authHeader.split(" ")[1];

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            if (err.name === "TokenExpiredError") {
                return res.status(403).json({ message: "Sesi Anda telah berakhir, silakan login kembali." });
            }
            return res.status(403).json({ message: "Token tidak valid!" });
        }

        req.user = decoded;
        next();
    });
};

module.exports = authenticateJWT;
