const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Reservation', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        guestName: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        guestPhone: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        reservationTime: {
            type: DataTypes.DATE,
            allowNull: false,
        },
        numberOfGuests: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        note: {
            type: DataTypes.TEXT,
        },
        status: {
            type: DataTypes.ENUM("PENDING", "CONFIRMED", "ARRIVED", "CHECKED_IN", "COMPLETED", "CANCELLED", "EXPIRED"),
            defaultValue: "PENDING",
        },
    }, {
        tableName: 'reservations',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
};
