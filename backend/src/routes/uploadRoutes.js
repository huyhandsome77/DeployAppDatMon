const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Đảm bảo thư mục uploads tồn tại
const uploadDir = 'uploads/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình lưu trữ
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route upload ảnh
router.post('/image', verifyToken, isAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
    }

    // Trả về URL của ảnh (đường dẫn tuyệt đối hoặc tương đối tùy cấu hình client)
    const imageUrl = `/uploads/${req.file.filename}`;
    res.json({ imageUrl: imageUrl });
});

module.exports = router;
