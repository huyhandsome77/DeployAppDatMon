const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('CartItem', {
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
        note: {
            type: DataTypes.TEXT,
        },
    }, {
        tableName: 'cart_items',
        timestamps: false,
    });
};
