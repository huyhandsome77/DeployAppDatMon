const express = require('express');
const router = express.Router();
const statController = require('../controllers/statController');
const { verifyToken, isAdmin } = require('../middlewares/authMiddleware');

router.get('/', verifyToken, isAdmin, statController.getStats);

module.exports = router;
