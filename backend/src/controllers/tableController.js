const { RestaurantTable, Reservation, Order } = require('../models');
const { Op } = require('sequelize');

exports.getAllTables = async (req, res, next) => {
    try {
        const tables = await RestaurantTable.findAll({
            order: [['tableNumber', 'ASC'], ['id', 'ASC']]
        });
        const now = new Date();
        const expiryThreshold = new Date(now.getTime() - 30 * 60000);

        const updatedTables = await Promise.all(tables.map(async (table) => {
            const tableData = table.toJSON();

            // Find active order or check-in time for live timer calculations
            const activeOrder = await Order.findOne({
                where: {
                    table_id: table.id,
                    status: { [Op.notIn]: ['COMPLETED', 'CANCELLED'] }
                },
                order: [['created_at', 'DESC']]
            });

            if (activeOrder) {
                tableData.occupiedSince = activeOrder.createdAt || activeOrder.created_at;
                const diffMs = now - new Date(tableData.occupiedSince);
                const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                tableData.timeUsedMins = diffMins;
                tableData.timeUsed = diffMins >= 60
                    ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}p`
                    : `${diffMins}p`;
            }

            if (table.status === 'OCCUPIED' && !tableData.timeUsed) {
                const checkInRes = await Reservation.findOne({
                    where: {
                        table_id: table.id,
                        status: 'CHECKED_IN'
                    },
                    order: [['updated_at', 'DESC']]
                });

                if (checkInRes) {
                    tableData.occupiedSince = checkInRes.updated_at || checkInRes.updatedAt;
                    const diffMs = now - new Date(tableData.occupiedSince);
                    const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                    tableData.timeUsedMins = diffMins;
                    tableData.timeUsed = diffMins >= 60
                        ? `${Math.floor(diffMins / 60)}h ${diffMins % 60}p`
                        : `${diffMins}p`;
                    tableData.guestCount = checkInRes.numberOfGuests;
                }
            }

            const activeReservation = await Reservation.findOne({
                where: {
                    table_id: table.id,
                    status: 'CONFIRMED',
                    reservationTime: {
                        [Op.gte]: expiryThreshold
                    }
                },
                order: [['reservationTime', 'ASC']]
            });

            if (activeReservation) {
                const resTime = new Date(activeReservation.reservationTime);
                if (now >= new Date(resTime.getTime() - 30 * 60000)) {
                    tableData.calculatedStatus = 'BOOKED';
                    tableData.activeReservation = activeReservation;

                    if (now >= resTime) {
                        tableData.waitingAlert = true;
                    }
                }
            }

            if (table.status === 'OCCUPIED') {
                tableData.calculatedStatus = 'OCCUPIED';
            } else if (!tableData.calculatedStatus) {
                tableData.calculatedStatus = table.status;
            }

            return tableData;
        }));

        res.json(updatedTables);
    } catch (error) {
        console.error('Error in getAllTables:', error);
        next(error);
    }
};

exports.createTable = async (req, res, next) => {
    try {
        const { tableNumber, capacity, qrCode, status } = req.body;
        const num = Number(tableNumber || 1);

        // Check if tableNumber exists
        const existing = await RestaurantTable.findOne({ where: { tableNumber: num } });
        if (existing) {
            return res.status(400).json({ message: `Bàn #${num} đã tồn tại trong hệ thống!` });
        }

        const newTable = await RestaurantTable.create({
            tableNumber: num,
            capacity: Number(capacity || 4),
            qrCode: qrCode || `T${num}`,
            status: status || 'AVAILABLE'
        });
        res.status(201).json({ message: 'Tạo bàn mới thành công', table: newTable });
    } catch (error) {
        next(error);
    }
};

exports.updateTable = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { tableNumber, capacity, qrCode, status } = req.body;

        let table = await RestaurantTable.findByPk(id);
        if (!table) {
            table = await RestaurantTable.findOne({
                where: {
                    [Op.or]: [{ id: id }, { tableNumber: id }]
                }
            });
        }

        if (!table) {
            return res.status(404).json({ message: 'Không tìm thấy bàn ăn' });
        }

        if (status === 'AVAILABLE') {
            const activeUnpaidOrder = await Order.findOne({
                where: {
                    table_id: table.id,
                    paymentStatus: { [Op.ne]: 'PAID' },
                    status: { [Op.notIn]: ['COMPLETED', 'CANCELLED'] }
                }
            });

            if (activeUnpaidOrder) {
                return res.status(400).json({
                    message: `Không thể chuyển Bàn #${table.tableNumber} về trạng thái 'Bàn trống' vì bàn này còn Đơn hàng #${activeUnpaidOrder.id} chưa thanh toán!`
                });
            }
        }

        await table.update({
            tableNumber: tableNumber !== undefined ? Number(tableNumber) : table.tableNumber,
            capacity: capacity !== undefined ? Number(capacity) : table.capacity,
            qrCode: qrCode || table.qrCode,
            status: status || table.status
        });

        res.json({ message: 'Cập nhật bàn thành công', table });
    } catch (error) {
        next(error);
    }
};

exports.updateTableStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        let table = await RestaurantTable.findByPk(id);
        if (!table) {
            table = await RestaurantTable.findOne({
                where: {
                    [Op.or]: [{ id: id }, { tableNumber: id }]
                }
            });
        }

        if (!table) {
            return res.status(404).json({ message: 'Không tìm thấy bàn ăn' });
        }

        if (status === 'AVAILABLE') {
            const activeUnpaidOrder = await Order.findOne({
                where: {
                    table_id: table.id,
                    paymentStatus: { [Op.ne]: 'PAID' },
                    status: { [Op.notIn]: ['COMPLETED', 'CANCELLED'] }
                }
            });

            if (activeUnpaidOrder) {
                return res.status(400).json({
                    message: `Không thể chuyển Bàn #${table.tableNumber} về trạng thái 'Bàn trống' vì bàn này còn Đơn hàng #${activeUnpaidOrder.id} chưa thanh toán!`
                });
            }
        }

        await table.update({ status });
        res.json({ message: "Cập nhật trạng thái bàn thành công", id: table.id, status });
    } catch (error) {
        next(error);
    }
};

exports.deleteTable = async (req, res, next) => {
    try {
        const { id } = req.params;
        let table = await RestaurantTable.findByPk(id);

        if (!table) {
            table = await RestaurantTable.findOne({
                where: {
                    [Op.or]: [{ id: id }, { tableNumber: id }]
                }
            });
        }

        if (!table) {
            return res.status(404).json({ message: 'Không tìm thấy bàn ăn với mã này trong hệ thống' });
        }

        const activeOrder = await Order.findOne({
            where: {
                table_id: table.id,
                status: { [Op.notIn]: ['COMPLETED', 'CANCELLED'] }
            }
        });

        if (activeOrder) {
            return res.status(400).json({ message: `Không thể xóa Bàn #${table.tableNumber} đang có đơn hàng #${activeOrder.id} chưa hoàn tất!` });
        }

        await table.destroy();
        res.json({ message: `Xóa bàn ăn #${table.tableNumber} thành công`, id: table.id });
    } catch (error) {
        next(error);
    }
};

exports.getTableByQRCode = async (req, res, next) => {
    try {
        const { qrCode } = req.params;
        const cleanCode = String(qrCode || '').trim();
        const extractedDigits = cleanCode.replace(/\D/g, '');
        const num = extractedDigits ? parseInt(extractedDigits, 10) : NaN;

        const orConditions = [
            { qrCode: cleanCode },
            { qrCode: `TABLE_${cleanCode}` },
            { qrCode: `T${cleanCode}` }
        ];

        if (!isNaN(num) && num > 0) {
            orConditions.push({ tableNumber: num });
            orConditions.push({ id: num });
            orConditions.push({ qrCode: `TABLE_${num}` });
            orConditions.push({ qrCode: `T${num}` });
        }

        const table = await RestaurantTable.findOne({
            where: {
                [Op.or]: orConditions
            }
        });

        if (!table) {
            return res.status(404).json({ message: "Không tìm thấy bàn với mã QR hoặc số bàn này" });
        }

        res.json(table);
    } catch (error) {
        next(error);
    }
};

exports.bulkCreateTables = async (req, res, next) => {
    try {
        const tables = req.body;

        if (!Array.isArray(tables)) {
            return res.status(400).json({ message: "Dữ liệu gửi lên phải là một mảng" });
        }

        const results = await RestaurantTable.bulkCreate(tables, {
            updateOnDuplicate: ['capacity', 'qrCode', 'status']
        });

        res.status(201).json({
            message: `Đã xử lý thành công ${results.length} bàn trong hệ thống`,
            data: results
        });
    } catch (error) {
        console.error("Bulk Create Tables Error:", error);
        res.status(500).json({ message: "Lỗi khi nạp dữ liệu bàn", error: error.message });
    }
};
