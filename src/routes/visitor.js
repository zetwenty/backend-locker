const express = require('express');
const router = express.Router();
const visitorController = require('../controllers/visitor');
const authenticateJWT = require('../middlewares/auth');

// Rute terkait Visitor
router.post('/register', visitorController.registerVisitor);
router.get('/', visitorController.getAllVisitors);
router.get('/details/:qr_code', visitorController.getVisitorDetails);
router.delete('/', authenticateJWT, visitorController.deleteVisitors);

module.exports = router;
