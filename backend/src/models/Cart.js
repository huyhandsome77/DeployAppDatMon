const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Cart', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        totalPrice: {
            type: DataTypes.DECIMAL(10, 2),
            defaultValue: 0,
        },
    }, {
        tableName: 'carts',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
};
