const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

router.get('/', tableController.getAllTables);
router.post('/', tableController.createTable);
router.put('/:id', tableController.updateTable);
router.delete('/:id', tableController.deleteTable);
router.get('/qr/:qrCode', tableController.getTableByQRCode);
router.post('/bulk', tableController.bulkCreateTables);
router.put('/:id/status', tableController.updateTableStatus);

module.exports = router;
