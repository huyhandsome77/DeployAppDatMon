const dotenv = require('dotenv');

dotenv.config();

const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

const swaggerSpec = {
    openapi: '3.0.3',
    info: {
        title: 'AppDatMon RESTful API Specification',
        version: '1.0.0',
        description: 'Complete interactive API documentation and reference for the AppDatMon Restaurant Management Backend (Node.js / Express / Sequelize / MySQL / PayOS).'
    },
    servers: [
        {
            url: baseUrl,
            description: 'Current Environment Server'
        }
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                description: 'Enter your JWT Bearer token obtained from POST /api/auth/login'
            }
        },
        schemas: {
            User: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    fullName: { type: 'string', example: 'Nguyễn Văn A' },
                    email: { type: 'string', example: 'user@example.com' },
                    phone: { type: 'string', example: '0901234567' },
                    username: { type: 'string', example: 'nguyenvana' },
                    avatar: { type: 'string', example: '/uploads/avatar1.jpg' },
                    points: { type: 'integer', example: 25000 },
                    role: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'KITCHEN', 'ADMIN'], example: 'CUSTOMER' },
                    status: { type: 'string', enum: ['ACTIVE', 'BLOCKED'], example: 'ACTIVE' },
                    created_at: { type: 'string', format: 'date-time' },
                    updated_at: { type: 'string', format: 'date-time' }
                }
            },
            RestaurantTable: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    tableNumber: { type: 'integer', example: 1 },
                    qrCode: { type: 'string', example: 'TABLE_01' },
                    capacity: { type: 'integer', example: 4 },
                    status: { type: 'string', enum: ['AVAILABLE', 'BOOKED', 'OCCUPIED', 'CLEANING'], example: 'AVAILABLE' }
                }
            },
            Category: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Món Nướng BBQ' },
                    description: { type: 'string', example: 'Các món nướng than hoa hảo hạng' },
                    image: { type: 'string', example: '/uploads/bbq.jpg' },
                    productCount: { type: 'integer', example: 12 }
                }
            },
            Product: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    name: { type: 'string', example: 'Bò Wagyu Nướng Đá Muối' },
                    description: { type: 'string', example: 'Thịt bò Wagyu A5 thượng hạng' },
                    price: { type: 'number', example: 350000 },
                    image: { type: 'string', example: '/uploads/wagyu.jpg' },
                    stock: { type: 'integer', example: 50 },
                    isAvailable: { type: 'boolean', example: true },
                    category_id: { type: 'integer', example: 1 }
                }
            },
            Order: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 10 },
                    table_id: { type: 'integer', example: 1 },
                    user_id: { type: 'integer', example: 1 },
                    totalPrice: { type: 'number', example: 1120000 },
                    discountAmount: { type: 'number', example: 20000 },
                    finalPrice: { type: 'number', example: 1100000 },
                    note: { type: 'string', example: 'Ít cay' },
                    status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'COMPLETED', 'CANCELLED'], example: 'PENDING' },
                    paymentStatus: { type: 'string', enum: ['UNPAID', 'PAID', 'REFUNDED'], example: 'UNPAID' },
                    paymentMethod: { type: 'string', enum: ['CASH', 'TRANSFER'], example: 'CASH' }
                }
            },
            Reservation: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 5 },
                    guestName: { type: 'string', example: 'Lê Văn C' },
                    guestPhone: { type: 'string', example: '0912345678' },
                    reservationTime: { type: 'string', format: 'date-time', example: '2026-08-15T19:00:00.000Z' },
                    numberOfGuests: { type: 'integer', example: 4 },
                    note: { type: 'string', example: 'Gần cửa sổ' },
                    status: { type: 'string', enum: ['PENDING', 'CONFIRMED', 'ARRIVED', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'EXPIRED'], example: 'PENDING' },
                    table_id: { type: 'integer', example: 2 }
                }
            },
            Review: {
                type: 'object',
                properties: {
                    id: { type: 'integer', example: 1 },
                    dish_name: { type: 'string', example: 'Bò Wagyu Nướng Đá Muối' },
                    rating: { type: 'integer', minimum: 1, maximum: 5, example: 5 },
                    content: { type: 'string', example: 'Thịt rất ngon và mềm' },
                    phone: { type: 'string', example: '0901234567' }
                }
            },
            ErrorResponse: {
                type: 'object',
                properties: {
                    message: { type: 'string', example: 'Mô tả chi tiết nguyên nhân lỗi' },
                    error: { type: 'string', example: 'Chi tiết kỹ thuật nếu có' }
                }
            }
        }
    },
    paths: {
        '/api/auth/register': {
            post: {
                tags: ['Authentication'],
                summary: 'Đăng ký tài khoản người dùng mới',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['fullName', 'phone', 'username', 'password'],
                                properties: {
                                    fullName: { type: 'string', example: 'Nguyễn Văn A' },
                                    phone: { type: 'string', example: '0901234567' },
                                    username: { type: 'string', example: 'nguyenvana' },
                                    password: { type: 'string', example: 'Password@123' },
                                    email: { type: 'string', example: 'nguyenvana@example.com' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    201: { description: 'Đăng ký thành công' },
                    400: { description: 'Số điện thoại hoặc username đã tồn tại' }
                }
            }
        },
        '/api/auth/login': {
            post: {
                tags: ['Authentication'],
                summary: 'Đăng nhập và nhận JWT token',
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['account', 'password'],
                                properties: {
                                    account: { type: 'string', example: '0901234567' },
                                    password: { type: 'string', example: 'Password@123' }
                                }
                            }
                        }
                    }
                },
                responses: {
                    200: { description: 'Đăng nhập thành công, trả về token' },
                    400: { description: 'Sai mật khẩu hoặc thiếu thông tin' },
                    404: { description: 'Tài khoản không tồn tại' }
                }
            }
        },
        '/api/auth/test': {
            get: {
                tags: ['Authentication'],
                summary: 'Health check route auth',
                responses: { 200: { description: 'OK' } }
            }
        },
        '/api/users': {
            get: {
                tags: ['Users'],
                summary: 'Lấy tất cả người dùng (Admin & Staff)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'search', in: 'query', schema: { type: 'string' }, description: 'Tìm theo tên, phone, email, username' },
                    { name: 'role', in: 'query', schema: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'KITCHEN', 'ADMIN'] } },
                    { name: 'status', in: 'query', schema: { type: 'string', enum: ['ACTIVE', 'BLOCKED'] } }
                ],
                responses: { 200: { description: 'Danh sách users' }, 401: { description: 'Unauthorized' }, 403: { description: 'Forbidden' } }
            },
            post: {
                tags: ['Users'],
                summary: 'Tạo người dùng mới (Admin)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['fullName', 'phone', 'username', 'password'],
                                properties: {
                                    fullName: { type: 'string' },
                                    email: { type: 'string' },
                                    phone: { type: 'string' },
                                    username: { type: 'string' },
                                    password: { type: 'string' },
                                    role: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'KITCHEN', 'ADMIN'] }
                                }
                            }
                        }
                    }
                },
                responses: { 201: { description: 'Created' } }
            }
        },
        '/api/users/profile': {
            get: {
                tags: ['Users'],
                summary: 'Lấy hồ sơ cá nhân',
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: 'Hồ sơ người dùng' } }
            },
            put: {
                tags: ['Users'],
                summary: 'Cập nhật hồ sơ cá nhân',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                properties: {
                                    fullName: { type: 'string' },
                                    email: { type: 'string' },
                                    phone: { type: 'string' },
                                    avatar: { type: 'string' }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: 'Updated' } }
            }
        },
        '/api/users/{id}': {
            get: {
                tags: ['Users'],
                summary: 'Lấy chi tiết người dùng theo ID (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'User detail' }, 404: { description: 'Not Found' } }
            },
            put: {
                tags: ['Users'],
                summary: 'Cập nhật người dùng (Admin/Staff)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Updated' } }
            },
            delete: {
                tags: ['Users'],
                summary: 'Xóa người dùng (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Deleted' } }
            }
        },
        '/api/products': {
            get: {
                tags: ['Products'],
                summary: 'Lấy danh sách món ăn',
                parameters: [
                    { name: 'category_id', in: 'query', schema: { type: 'integer' } },
                    { name: 'search', in: 'query', schema: { type: 'string' } }
                ],
                responses: { 200: { description: 'Products list' } }
            },
            post: {
                tags: ['Products'],
                summary: 'Thêm món ăn mới (Admin)',
                security: [{ bearerAuth: [] }],
                responses: { 201: { description: 'Created' } }
            }
        },
        '/api/products/{id}': {
            get: {
                tags: ['Products'],
                summary: 'Lấy chi tiết món ăn theo ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Product detail' } }
            },
            put: {
                tags: ['Products'],
                summary: 'Cập nhật món ăn (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Updated' } }
            },
            delete: {
                tags: ['Products'],
                summary: 'Xóa món ăn (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 204: { description: 'No Content' } }
            }
        },
        '/api/categories': {
            get: {
                tags: ['Categories'],
                summary: 'Lấy tất cả danh mục',
                parameters: [{ name: 'search', in: 'query', schema: { type: 'string' } }],
                responses: { 200: { description: 'Categories list with productCount' } }
            },
            post: {
                tags: ['Categories'],
                summary: 'Tạo danh mục mới (Admin)',
                security: [{ bearerAuth: [] }],
                responses: { 201: { description: 'Created' } }
            }
        },
        '/api/categories/{id}': {
            get: {
                tags: ['Categories'],
                summary: 'Lấy chi tiết danh mục theo ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Category detail' } }
            },
            put: {
                tags: ['Categories'],
                summary: 'Cập nhật danh mục (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Updated' } }
            },
            delete: {
                tags: ['Categories'],
                summary: 'Xóa danh mục (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 204: { description: 'No Content' } }
            }
        },
        '/api/tables': {
            get: {
                tags: ['Tables'],
                summary: 'Lấy toàn bộ bàn ăn kèm tính toán thời gian ngồi',
                responses: { 200: { description: 'Tables list with timeUsed & calculatedStatus' } }
            },
            post: {
                tags: ['Tables'],
                summary: 'Tạo bàn ăn mới',
                responses: { 201: { description: 'Created' } }
            }
        },
        '/api/tables/qr/{qrCode}': {
            get: {
                tags: ['Tables'],
                summary: 'Quét mã QR bàn ăn',
                parameters: [{ name: 'qrCode', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Table by QR' }, 404: { description: 'Not Found' } }
            }
        },
        '/api/tables/bulk': {
            post: {
                tags: ['Tables'],
                summary: 'Tạo hàng loạt bàn ăn',
                responses: { 201: { description: 'Bulk Created' } }
            }
        },
        '/api/tables/{id}': {
            put: {
                tags: ['Tables'],
                summary: 'Cập nhật thông tin bàn',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Updated' } }
            },
            delete: {
                tags: ['Tables'],
                summary: 'Xóa bàn ăn',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Deleted' } }
            }
        },
        '/api/tables/{id}/status': {
            put: {
                tags: ['Tables'],
                summary: 'Cập nhật trạng thái bàn',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
                responses: { 200: { description: 'Updated' } }
            }
        },
        '/api/orders': {
            get: {
                tags: ['Orders'],
                summary: 'Lấy danh sách tất cả đơn hàng',
                parameters: [
                    { name: 'status', in: 'query', schema: { type: 'string' } },
                    { name: 'paymentStatus', in: 'query', schema: { type: 'string' } }
                ],
                responses: { 200: { description: 'Orders list' } }
            },
            post: {
                tags: ['Orders'],
                summary: 'Tạo đơn đặt món mới (Hỗ trợ trừ điểm thưởng)',
                responses: { 201: { description: 'Created' } }
            }
        },
        '/api/orders/my-orders': {
            get: {
                tags: ['Orders'],
                summary: 'Lấy lịch sử đơn hàng của người dùng',
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: 'User orders' } }
            }
        },
        '/api/orders/{id}': {
            get: {
                tags: ['Orders'],
                summary: 'Chi tiết đơn hàng theo ID',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Order detail' } }
            },
            delete: {
                tags: ['Orders'],
                summary: 'Xóa đơn hàng',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Deleted' } }
            }
        },
        '/api/orders/{id}/status': {
            put: {
                tags: ['Orders'],
                summary: 'Cập nhật trạng thái chế biến đơn',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Updated' } }
            }
        },
        '/api/orders/{id}/pay': {
            put: {
                tags: ['Orders'],
                summary: 'Thanh toán đơn lẻ và trả bàn',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Paid' } }
            }
        },
        '/api/orders/table/{tableId}': {
            get: {
                tags: ['Orders'],
                summary: 'Lấy đơn chưa thanh toán của bàn',
                parameters: [{ name: 'tableId', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Orders of table' } }
            }
        },
        '/api/orders/table/{tableId}/pay-all': {
            put: {
                tags: ['Orders'],
                summary: 'Thanh toán gộp toàn bộ bàn',
                parameters: [{ name: 'tableId', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'All paid' } }
            }
        },
        '/api/reservations': {
            get: {
                tags: ['Reservations'],
                summary: 'Lấy tất cả lịch đặt bàn',
                responses: { 200: { description: 'Reservations list' } }
            },
            post: {
                tags: ['Reservations'],
                summary: 'Đặt bàn mới (Tự động gán bàn trống)',
                responses: { 201: { description: 'Created' } }
            }
        },
        '/api/reservations/my-reservations': {
            get: {
                tags: ['Reservations'],
                summary: 'Lịch đặt bàn của tôi',
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: 'My reservations' } }
            }
        },
        '/api/reservations/{id}/confirm': {
            put: {
                tags: ['Reservations'],
                summary: 'Xác nhận lịch đặt bàn',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Confirmed' } }
            }
        },
        '/api/reservations/{id}/check-in': {
            put: {
                tags: ['Reservations'],
                summary: 'Check-in nhận bàn',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Checked in' } }
            }
        },
        '/api/reservations/{id}/cancel': {
            put: {
                tags: ['Reservations'],
                summary: 'Hủy lịch đặt bàn',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Cancelled' } }
            }
        },
        '/api/reservations/{id}/status': {
            put: {
                tags: ['Reservations'],
                summary: 'Cập nhật trạng thái đặt bàn',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Updated' } }
            }
        },
        '/api/points/add-points': {
            post: {
                tags: ['Points'],
                summary: 'Tích điểm 5% từ hóa đơn hoàn tất (Staff/Admin)',
                security: [{ bearerAuth: [] }],
                requestBody: {
                    required: true,
                    content: {
                        'application/json': {
                            schema: {
                                type: 'object',
                                required: ['phone', 'orderId'],
                                properties: {
                                    phone: { type: 'string', example: '0901234567' },
                                    orderId: { type: 'integer', example: 10 }
                                }
                            }
                        }
                    }
                },
                responses: { 200: { description: 'Points added successfully' } }
            }
        },
        '/api/reviews': {
            get: {
                tags: ['Reviews'],
                summary: 'Lấy danh sách đánh giá',
                parameters: [
                    { name: 'page', in: 'query', schema: { type: 'integer' } },
                    { name: 'limit', in: 'query', schema: { type: 'integer' } },
                    { name: 'date', in: 'query', schema: { type: 'string' } }
                ],
                responses: { 200: { description: 'Reviews list' } }
            },
            post: {
                tags: ['Reviews'],
                summary: 'Gửi đánh giá mới',
                responses: { 201: { description: 'Created' } }
            }
        },
        '/api/reviews/{id}': {
            delete: {
                tags: ['Reviews'],
                summary: 'Xóa đánh giá (Admin)',
                parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Deleted' } }
            }
        },
        '/api/stats': {
            get: {
                tags: ['Stats'],
                summary: 'Thống kê doanh thu & đơn hàng (Admin)',
                security: [{ bearerAuth: [] }],
                parameters: [
                    { name: 'type', in: 'query', schema: { type: 'string', enum: ['day', 'month', 'year'] } },
                    { name: 'date', in: 'query', schema: { type: 'string' } }
                ],
                responses: { 200: { description: 'Stats data' } }
            }
        },
        '/api/payos/create-payment-link': {
            post: {
                tags: ['PayOS'],
                summary: 'Tạo link thanh toán PayOS VietQR',
                responses: { 200: { description: 'Checkout link created' } }
            }
        },
        '/api/payos/order-status/{orderId}': {
            get: {
                tags: ['PayOS'],
                summary: 'Kiểm tra trạng thái thanh toán PayOS',
                parameters: [{ name: 'orderId', in: 'path', required: true, schema: { type: 'integer' } }],
                responses: { 200: { description: 'Status checked' } }
            }
        },
        '/api/payos/webhook': {
            post: {
                tags: ['PayOS'],
                summary: 'PayOS IPN Webhook',
                responses: { 200: { description: 'Webhook received' } }
            }
        },
        '/api/payos/debug': {
            get: {
                tags: ['PayOS'],
                summary: 'Debug PayOS Config',
                responses: { 200: { description: 'PayOS availability' } }
            }
        },
        '/api/payos/payment-success': {
            get: {
                tags: ['PayOS'],
                summary: 'Trang thông báo thanh toán thành công',
                responses: { 200: { description: 'HTML render' } }
            }
        },
        '/api/payos/payment-cancel': {
            get: {
                tags: ['PayOS'],
                summary: 'Trang thông báo hủy thanh toán',
                responses: { 200: { description: 'HTML render' } }
            }
        },
        '/api/upload/image': {
            post: {
                tags: ['Uploads'],
                summary: 'Upload hình ảnh (Multer multipart)',
                security: [{ bearerAuth: [] }],
                responses: { 200: { description: 'Image URL' } }
            }
        }
    }
};

module.exports = swaggerSpec;