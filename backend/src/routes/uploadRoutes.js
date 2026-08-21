const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_VERSION;
const uploadDir = isServerless ? '/tmp/uploads' : path.join(__dirname, '..', '..', 'uploads');

// Cấu hình lưu trữ an toàn (không gọi mkdirSync ở top-level)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        try {
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        } catch (err) {
            cb(null, '/tmp');
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route upload ảnh
router.post('/image', verifyToken, isAdmin, (req, res, next) => {
    upload.single('image')(req, res, (err) => {
        if (err) {
            return res.status(500).json({ message: "Upload failed", error: err.message });
        }
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }
        const imageUrl = `/uploads/${req.file.filename}`;
        return res.json({ imageUrl: imageUrl });
    });
});

module.exports = router;
