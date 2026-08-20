const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('User', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        fullName: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        email: {
            type: DataTypes.STRING(100),
            unique: true,
        },
        phone: {
            type: DataTypes.STRING(20),
            unique: true,
            allowNull: false,
        },
        username:{
            type: DataTypes.STRING(40),
            allowNull: false,
            unique: true,
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false,
        },
        avatar: {
            type: DataTypes.TEXT,
        },
        points: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        role: {
            type: DataTypes.ENUM("CUSTOMER", "STAFF", "KITCHEN", "ADMIN"),
            defaultValue: "CUSTOMER",
        },
        status: {
            type: DataTypes.ENUM("ACTIVE", "BLOCKED"),
            defaultValue: "ACTIVE",
        },
    }, {
        tableName: 'users',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
};
