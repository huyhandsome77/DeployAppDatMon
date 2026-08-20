const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Category', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
        },
        image: {
            type: DataTypes.TEXT,
        },
    }, {
        tableName: 'categories',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: false,
    });
};
