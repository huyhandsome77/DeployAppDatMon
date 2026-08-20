const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Product', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        name: {
            type: DataTypes.STRING(150),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
        },
        price: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
        },
        image: {
            type: DataTypes.TEXT,
        },
        stock: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        isAvailable: {
            type: DataTypes.BOOLEAN,
            defaultValue: true,
        },
        category_id: {
            type: DataTypes.BIGINT,
            allowNull: false,
            references: {
                model: 'categories',
                key: 'id'
            }
        },
    }, {
        tableName: 'products',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
};
