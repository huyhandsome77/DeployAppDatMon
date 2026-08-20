const { Order } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('sequelize');

exports.getStats = async (req, res, next) => {
    try {
        const { type = 'day', date } = req.query;
        let startDate, endDate;

        const targetDate = date ? new Date(date) : new Date();

        if (type === 'day') {
            startDate = new Date(targetDate.setHours(0, 0, 0, 0));
            endDate = new Date(targetDate.setHours(23, 59, 59, 999));
        } else if (type === 'month') {
            startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
            endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (type === 'year') {
            startDate = new Date(targetDate.getFullYear(), 0, 1);
            endDate = new Date(targetDate.getFullYear(), 11, 31, 23, 59, 59, 999);
        }

        const stats = await Order.findOne({
            attributes: [
                [sequelize.fn('COUNT', sequelize.col('id')), 'totalOrders'],
                [sequelize.fn('SUM', sequelize.col('finalPrice')), 'totalRevenue']
            ],
            where: {
                status: 'COMPLETED',
                paymentStatus: 'PAID',
                created_at: {
                    [Op.between]: [startDate, endDate]
                }
            }
        });

        res.json({
            type,
            startDate,
            endDate,
            totalOrders: parseInt(stats.getDataValue('totalOrders')) || 0,
            totalRevenue: parseFloat(stats.getDataValue('totalRevenue')) || 0
        });

    } catch (error) {
        console.error("Get Stats Error:", error);
        next(error);
    }
};
