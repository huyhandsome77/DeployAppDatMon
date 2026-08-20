const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Order', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        totalPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        discountAmount: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
        finalPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.ENUM("PENDING", "CONFIRMED", "PREPARING", "READY", "COMPLETED", "CANCELLED"),
            defaultValue: "PENDING",
        },
        paymentStatus: {
            type: DataTypes.ENUM("UNPAID", "PAID", "REFUNDED"),
            defaultValue: "UNPAID",
        },
        paymentMethod: {
            type: DataTypes.ENUM("CASH", "TRANSFER"),
            allowNull: true,
        },
        isPointsAdded: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
    }, {
        tableName: 'orders',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
};
