const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Payment', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        amount: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        paymentMethod: {
            type: DataTypes.ENUM("CASH", "VNPAY", "MOMO", "BANKING"),
            allowNull: false,
        },
        transactionCode: {
            type: DataTypes.STRING(255),
        },
        status: {
            type: DataTypes.ENUM("PENDING", "SUCCESS", "FAILED"),
            defaultValue: "PENDING",
        },
        paidAt: {
            type: DataTypes.DATE,
        },
    }, {
        tableName: 'payments',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    });
};
