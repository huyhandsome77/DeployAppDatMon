const { sequelize, connectDB } = require('../configs/db');

const User = require('./User')(sequelize);
const RestaurantTable = require('./RestaurantTable')(sequelize);
const Category = require('./Category')(sequelize);
const Product = require('./Product')(sequelize);
const Cart = require('./Cart')(sequelize);
const CartItem = require('./CartItem')(sequelize);
const Reservation = require('./Reservation')(sequelize);
const Order = require('./Order')(sequelize);
const OrderItem = require('./OrderItem')(sequelize);
const Payment = require('./Payment')(sequelize);
const Review = require('./Review')(sequelize);

// Category - Product
Category.hasMany(Product, {
    foreignKey: 'category_id',
    as: 'products'
});
Product.belongsTo(Category, {
    foreignKey: 'category_id',
    as: 'category'
});

// User - Cart
User.hasOne(Cart, { foreignKey: "user_id" });
Cart.belongsTo(User, { foreignKey: "user_id" });

// Cart - CartItem
Cart.hasMany(CartItem, { foreignKey: "cart_id" });
CartItem.belongsTo(Cart, { foreignKey: "cart_id" });

// Product - CartItem
Product.hasMany(CartItem, { foreignKey: "product_id" });
CartItem.belongsTo(Product, { foreignKey: "product_id" });

// User - Reservation
User.hasMany(Reservation, { foreignKey: "user_id", as: 'reservations' });
Reservation.belongsTo(User, { foreignKey: "user_id", as: 'User' });

// RestaurantTable - Reservation
RestaurantTable.hasMany(Reservation, { foreignKey: "table_id", as: 'reservations' });
Reservation.belongsTo(RestaurantTable, { foreignKey: "table_id", as: 'table' });

// User - Order
User.hasMany(Order, { foreignKey: "user_id", as: 'orders' });
Order.belongsTo(User, { foreignKey: "user_id", as: 'User' });

// RestaurantTable - Order
RestaurantTable.hasMany(Order, { foreignKey: "table_id", as: 'orders' });
Order.belongsTo(RestaurantTable, { foreignKey: "table_id", as: 'RestaurantTable' });

// Reservation - Order
Reservation.hasMany(Order, { foreignKey: "reservation_id" });
Order.belongsTo(Reservation, { foreignKey: "reservation_id" });

// Order - OrderItem
Order.hasMany(OrderItem, { foreignKey: "order_id", as: 'OrderItems' });
OrderItem.belongsTo(Order, { foreignKey: "order_id" });

// Product - OrderItem
Product.hasMany(OrderItem, { foreignKey: "product_id" });
OrderItem.belongsTo(Product, { foreignKey: "product_id", as: 'Product' });

// Order - Payment
Order.hasOne(Payment, { foreignKey: "order_id" });
Payment.belongsTo(Order, { foreignKey: "order_id" });

// User - Review
User.hasMany(Review, { foreignKey: "user_id", as: 'reviews' });
Review.belongsTo(User, { foreignKey: "user_id", as: 'user' });

module.exports = {
    sequelize,
    connectDB,
    User,
    RestaurantTable,
    Category,
    Product,
    Cart,
    CartItem,
    Reservation,
    Order,
    OrderItem,
    Payment,
    Review
};
