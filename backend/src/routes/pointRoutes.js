const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const { verifyToken, isStaffOrAdmin } = require('../middlewares/authMiddleware');

// Admin hoặc Nhân viên mới được tích điểm thủ công cho khách
router.post('/add-points', verifyToken, isStaffOrAdmin, pointController.addPointsFromOrder);

module.exports = router;
