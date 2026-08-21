const { Payment, Order, User, RestaurantTable, OrderItem, Product } = require('../models');
const { Op } = require('sequelize');

exports.getAllPayments = async (req, res, next) => {
    try {
        const { status, paymentMethod, search } = req.query;
        const whereClause = {};

        if (status) whereClause.status = status;
        if (paymentMethod) whereClause.paymentMethod = paymentMethod;
        if (search) {
            whereClause[Op.or] = [
                { transactionCode: { [Op.like]: `%${search}%` } },
                { paymentMethod: { [Op.like]: `%${search}%` } }
            ];
        }

        const payments = await Payment.findAll({
            where: whereClause,
            include: [
                {
                    model: Order,
                    as: 'Order',
                    include: [
                        { model: User, as: 'User', attributes: ['id', 'fullName', 'phone', 'email'] },
                        { model: RestaurantTable, as: 'RestaurantTable', attributes: ['id', 'tableNumber'] },
                        {
                            model: OrderItem,
                            as: 'OrderItems',
                            include: [{ model: Product, as: 'Product' }]
                        }
                    ]
                }
            ],
            order: [['created_at', 'DESC']]
        });

        res.json(payments);
    } catch (error) {
        console.error("Get All Payments Error:", error);
        next(error);
    }
};

exports.getPaymentById = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findByPk(id, {
            include: [
                {
                    model: Order,
                    as: 'Order',
                    include: [
                        { model: User, as: 'User', attributes: ['id', 'fullName', 'phone', 'email'] },
                        { model: RestaurantTable, as: 'RestaurantTable', attributes: ['id', 'tableNumber'] },
                        {
                            model: OrderItem,
                            as: 'OrderItems',
                            include: [{ model: Product, as: 'Product' }]
                        }
                    ]
                }
            ]
        });

        if (!payment) {
            return res.status(404).json({ message: "Không tìm thấy giao dịch thanh toán" });
        }

        res.json(payment);
    } catch (error) {
        console.error("Get Payment By Id Error:", error);
        next(error);
    }
};

exports.deletePayment = async (req, res, next) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findByPk(id);

        if (!payment) {
            return res.status(404).json({ message: "Không tìm thấy giao dịch thanh toán" });
        }

        await payment.destroy();
        res.json({ message: "Xóa thông tin thanh toán thành công" });
    } catch (error) {
        console.error("Delete Payment Error:", error);
        next(error);
    }
};
