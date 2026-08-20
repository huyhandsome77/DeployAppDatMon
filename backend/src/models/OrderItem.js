const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('OrderItem', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        quantity: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        unitPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        totalPrice: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        note: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.ENUM("WAITING", "COOKING", "DONE", "CANCELLED"),
            defaultValue: "WAITING",
        },
    }, {
        tableName: 'order_items',
        timestamps: false,
    });
};
