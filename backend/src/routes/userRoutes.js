const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken, isAdmin, isStaffOrAdmin } = require('../middlewares/authMiddleware');

// 1. Lấy tất cả người dùng (Admin & Staff)
router.get('/', verifyToken, isStaffOrAdmin, userController.getAllUsers);

// 2. Lấy thông tin cá nhân
router.get('/profile', verifyToken, userController.getUserProfile);

// 3. Cập nhật thông tin cá nhân
router.put('/profile', verifyToken, userController.updateProfile);

// 4. Lấy thông tin chi tiết một người dùng (Admin)
router.get('/:id', verifyToken, isAdmin, userController.getUserById);

// 5. Tạo người dùng mới (Admin)
router.post('/', verifyToken, isAdmin, userController.createUser);

// 6. Cập nhật thông tin người dùng (Admin & Staff)
router.put('/:id', verifyToken, isStaffOrAdmin, userController.updateUser);

// 6. Xóa người dùng (Admin)
router.delete('/:id', verifyToken, isAdmin, userController.deleteUser);

module.exports = router;
