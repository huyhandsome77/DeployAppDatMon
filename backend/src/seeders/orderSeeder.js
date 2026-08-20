const { Order, OrderItem, Product, User } = require('../models');

const seedOrders = async () => {
    try {
        const count = await Order.count();
        if (count < 5) {
            const products = await Product.findAll();
            if (products.length === 0) return;

            const existingUser = await User.findOne();
            const validUserId = existingUser ? existingUser.id : null;

            const p1 = products[0]; // Sushi Cá Hồi (150k)
            const p2 = products[1] || products[0]; // Sashimi (450k)
            const p3 = products[2] || products[0]; // Ramen (120k)

            const price1 = Number(p1.price) || 150000;
            const price2 = Number(p2.price) || 450000;
            const price3 = Number(p3.price) || 120000;

            const ordersData = [
                {
                    table_id: 1,
                    user_id: validUserId,
                    totalPrice: price1 * 2 + price3,
                    finalPrice: price1 * 2 + price3,
                    status: 'CONFIRMED',
                    paymentStatus: 'UNPAID',
                    items: [
                        { product_id: p1.id, quantity: 2, unitPrice: price1, totalPrice: price1 * 2, status: 'COOKING' },
                        { product_id: p3.id, quantity: 1, unitPrice: price3, totalPrice: price3, status: 'WAITING' }
                    ]
                },
                {
                    table_id: 2,
                    user_id: validUserId,
                    totalPrice: price2 + price3 * 2,
                    finalPrice: price2 + price3 * 2,
                    status: 'PREPARING',
                    paymentStatus: 'UNPAID',
                    items: [
                        { product_id: p2.id, quantity: 1, unitPrice: price2, totalPrice: price2, status: 'COOKING' },
                        { product_id: p3.id, quantity: 2, unitPrice: price3, totalPrice: price3 * 2, status: 'COOKING' }
                    ]
                },
                {
                    table_id: 3,
                    user_id: validUserId,
                    totalPrice: price1 * 3,
                    finalPrice: price1 * 3,
                    status: 'READY',
                    paymentStatus: 'UNPAID',
                    items: [
                        { product_id: p1.id, quantity: 3, unitPrice: price1, totalPrice: price1 * 3, status: 'DONE' }
                    ]
                },
                {
                    table_id: 4,
                    user_id: validUserId,
                    totalPrice: price1 + price2,
                    finalPrice: price1 + price2,
                    status: 'COMPLETED',
                    paymentStatus: 'PAID',
                    paymentMethod: 'CASH',
                    items: [
                        { product_id: p1.id, quantity: 1, unitPrice: price1, totalPrice: price1, status: 'DONE' },
                        { product_id: p2.id, quantity: 1, unitPrice: price2, totalPrice: price2, status: 'DONE' }
                    ]
                },
                {
                    table_id: 5,
                    user_id: validUserId,
                    totalPrice: price2 * 2,
                    finalPrice: price2 * 2,
                    status: 'COMPLETED',
                    paymentStatus: 'PAID',
                    paymentMethod: 'TRANSFER',
                    items: [
                        { product_id: p2.id, quantity: 2, unitPrice: price2, totalPrice: price2 * 2, status: 'DONE' }
                    ]
                },
                {
                    table_id: 6,
                    user_id: null,
                    totalPrice: price3,
                    finalPrice: price3,
                    status: 'PENDING',
                    paymentStatus: 'UNPAID',
                    items: [
                        { product_id: p3.id, quantity: 1, unitPrice: price3, totalPrice: price3, status: 'WAITING' }
                    ]
                }
            ];

            for (const item of ordersData) {
                const { items, ...orderInfo } = item;
                const order = await Order.create(orderInfo);
                const orderItems = items.map(it => ({ ...it, order_id: order.id }));
                await OrderItem.bulkCreate(orderItems);
            }

            console.log('[OrderSeeder] Đã tạo thành công bộ đơn hàng mẫu thử nghiệm.');
        } else {
            console.log(`[OrderSeeder] Đã có ${count} đơn hàng trong database.`);
        }
    } catch (error) {
        console.error('[OrderSeeder] Lỗi khi tạo dữ liệu đơn hàng mẫu:', error);
    }
};

module.exports = { seedOrders };
