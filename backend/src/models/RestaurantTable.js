const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('RestaurantTable', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        tableNumber: {
            type: DataTypes.INTEGER,
            unique: true,
            allowNull: false,
        },
        qrCode: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        capacity: {
            type: DataTypes.INTEGER,
            defaultValue: 4,
        },
        status: {
            type: DataTypes.ENUM("AVAILABLE", "BOOKED", "OCCUPIED", "CLEANING"),
            defaultValue: "AVAILABLE",
        },
    }, {
        tableName: 'restaurant_tables',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    });
};
