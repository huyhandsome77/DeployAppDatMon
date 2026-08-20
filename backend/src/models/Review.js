const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Review', {
        id: {
            type: DataTypes.BIGINT,
            autoIncrement: true,
            primaryKey: true,
        },
        user_id: {
            type: DataTypes.BIGINT,
            allowNull: true,
            references: {
                model: 'users',
                key: 'id'
            }
        },
        phone: {
            type: DataTypes.STRING(20),
            allowNull: true,
        },
        dish_name: {
            type: DataTypes.STRING(150),
            allowNull: true,
        },
        content: {
            type: DataTypes.TEXT,
            allowNull: true,
        },
        rating: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1,
                max: 5
            }
        }
    }, {
        tableName: 'reviews',
        timestamps: true,
        createdAt: 'created_at',
        updatedAt: 'updated_at',
    });
};
