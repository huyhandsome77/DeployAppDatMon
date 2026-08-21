const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

// Dùng memory storage để lưu trữ và nén ảnh trực tiếp thành Data URL
// Hoàn toàn không phụ thuộc vào hệ thống file tĩnh trên Vercel Serverless
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Route upload ảnh trả về Data URL tương thích 100% với Vercel & Supabase
router.post('/image', verifyToken, isAdmin, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(500).json({ message: "Upload failed", error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        try {
            const mimeType = req.file.mimetype || 'image/webp';
            const base64 = req.file.buffer.toString('base64');
            const dataUrl = `data:${mimeType};base64,${base64}`;
            return res.json({ imageUrl: dataUrl });
        } catch (processErr) {
            return res.status(500).json({ message: "Lỗi xử lý ảnh", error: processErr.message });
        }
    });
});

module.exports = router;
