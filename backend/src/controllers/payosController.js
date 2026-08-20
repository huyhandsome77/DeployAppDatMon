const PayOSLib = require("@payos/node");
const { Order, RestaurantTable, sequelize } = require("../models");
const { Op } = require('sequelize');

const PayOS = PayOSLib.default || (typeof PayOSLib === 'function' ? PayOSLib : PayOSLib.PayOS);

let payos;
if (PayOS) {
    payos = new PayOS(
        process.env.PAYOS_CLIENT_ID,
        process.env.PAYOS_API_KEY,
        process.env.PAYOS_CHECKSUM_KEY
    );
}

exports.createPaymentLink = async (req, res, next) => {
    try {
        const { orderId, tableId } = req.body;
        let amount = 0;
        let description = "";
        let orderToUpdate = null;

        if (tableId) {
            // Thanh toán gộp theo bàn
            const orders = await Order.findAll({
                where: { table_id: tableId, paymentStatus: 'UNPAID' }
            });
            if (orders.length === 0) return res.status(404).json({ message: "Không tìm thấy hóa đơn chưa thanh toán cho bàn này" });

            amount = orders.reduce((sum, o) => sum + Number(o.finalPrice), 0);
            description = `TTOAN BAN B${tableId}`;
            // Với gộp, ta sẽ lưu orderCode vào tất cả các đơn hàng của bàn đó
            orderToUpdate = orders;
        } else if (orderId) {
            // Thanh toán đơn lẻ
            const order = await Order.findByPk(orderId);
            if (!order) return res.status(404).json({ message: "Không tìm thấy đơn hàng" });

            amount = Number(order.finalPrice);
            description = `THANHTOAN DH${order.id}`;
            orderToUpdate = [order];
        } else {
            return res.status(400).json({ message: "Thiếu orderId hoặc tableId" });
        }

        const domain = "http://54.81.9.236:3000";
        const orderCode = Number(String(Math.floor(Date.now() / 1000)).slice(-8));

        const paymentBody = {
            orderCode: orderCode,
            amount: Math.round(amount),
            description: description,
            returnUrl: `${domain}/api/payos/payment-success`,
            cancelUrl: `${domain}/api/payos/payment-cancel`,
        };

        let paymentLinkResponse;
        if (payos.paymentRequests && typeof payos.paymentRequests.create === 'function') {
            paymentLinkResponse = await payos.paymentRequests.create(paymentBody);
        } else {
            paymentLinkResponse = await payos.createPaymentLink(paymentBody);
        }

        // Lưu orderCode để đối soát
        for (const order of orderToUpdate) {
            const currentNote = order.note || "";
            const updatedNote = `${currentNote} [PAYOS:${orderCode}]`.trim();
            await order.update({ note: updatedNote });
        }

        res.json(paymentLinkResponse);

    } catch (error) {
        console.error("PayOS Create Error:", error.message);
        res.status(500).json({ message: "Lỗi kết nối PayOS", error: error.message });
    }
};

/**
 * Kiểm tra trạng thái đơn hàng trực tiếp từ PayOS (Dùng làm Fallback cho Polling)
 */
exports.checkOrderStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findByPk(orderId);
        if (!order) return res.status(404).json({ message: "Order not found" });

        // Nếu đã thanh toán trong DB rồi thì trả về luôn
        if (order.paymentStatus === 'PAID') {
            return res.json({ status: 'PAID', message: 'Already paid' });
        }

        // Tìm orderCode từ note
        const match = order.note?.match(/\[PAYOS:(\d+)\]/);
        if (!match) return res.json({ status: order.paymentStatus, message: 'No PayOS code found' });

        const orderCode = Number(match[1]);

        // Hỏi trực tiếp PayOS
        let paymentInfo;
        if (payos.paymentRequests && typeof payos.paymentRequests.getPaymentLinkInformation === 'function') {
            paymentInfo = await payos.paymentRequests.getPaymentLinkInformation(orderCode);
        } else {
            paymentInfo = await payos.getPaymentLinkInformation(orderCode);
        }

        console.log(`[PayOS Check] Trạng thái đơn ${orderId} trên PayOS: ${paymentInfo.status}`);

        // Nếu PayOS báo đã trả, cập nhật ngay vào DB
        if (paymentInfo.status === 'PAID') {
            await order.update({
                paymentStatus: 'PAID',
                status: 'COMPLETED',
                paymentMethod: 'TRANSFER'
            });

            if (order.table_id) {
                await RestaurantTable.update({ status: 'AVAILABLE' }, { where: { id: order.table_id } });
            }
            return res.json({ status: 'PAID', message: 'Updated from PayOS' });
        }

        res.json({ status: order.paymentStatus, payosStatus: paymentInfo.status });

    } catch (error) {
        console.error("Check Status Error:", error.message);
        res.status(500).json({ error: error.message });
    }
};

exports.payosWebhook = async (req, res) => {
    try {
        const webhookData = req.body;
        console.log(">>> NHẬN WEBHOOK TỪ PAYOS:", JSON.stringify(webhookData));

        if (webhookData.code === "00") {
            const { orderCode } = webhookData.data;

            const order = await Order.findOne({
                where: { note: { [Op.like]: `%[PAYOS:${orderCode}]%` } }
            });

            if (order && order.paymentStatus !== 'PAID') {
                await order.update({
                    paymentStatus: 'PAID',
                    status: 'COMPLETED',
                    paymentMethod: 'TRANSFER'
                });

                if (order.table_id) {
                    await RestaurantTable.update({ status: 'AVAILABLE' }, { where: { id: order.table_id } });
                }
                console.log(`>>> WEBHOOK: Đơn hàng #${order.id} đã hoàn thành.`);
            }
        }
        return res.json({ message: "Success" });
    } catch (error) {
        return res.status(200).json({ message: "Error handled" });
    }
};

exports.debugPayOS = async (req, res) => {
    res.json({
        available: !!payos,
        methods: payos ? Object.keys(payos) : []
    });
};

exports.paymentSuccess = (req, res) => {
    res.send("<div style='text-align:center; padding-top:100px;'><h1>Thanh toán thành công!</h1><p>Hệ thống đang cập nhật, vui lòng quay lại App.</p></div>");
};

exports.paymentCancel = (req, res) => {
    res.send("<div style='text-align:center; padding-top:100px;'><h1>Đã hủy thanh toán</h1></div>");
};
