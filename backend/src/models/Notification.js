const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Notification = sequelize.define('Notification', {
        id: {
            type: DataTypes.BIGINT,
            primaryKey: true,
            autoIncrement: true
        },
        title: {
            type: DataTypes.STRING,
            allowNull: false
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        type: {
            type: DataTypes.ENUM('ORDER', 'PAYMENT', 'POINT', 'PROMOTION', 'SYSTEM'),
            defaultValue: 'SYSTEM'
        },
        isRead: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
            field: 'is_read'
        }
    }, {
        tableName: 'notifications',
        timestamps: true,
        underscored: true
    });

    return Notification;
};
