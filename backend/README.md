# Backend AppDatMon (Node.js + Express + Sequelize + MySQL)

## Giới thiệu
Dự án Backend cho ứng dụng đặt món, sử dụng Node.js, Express, và Sequelize ORM để làm việc với MySQL.

## Cấu trúc thư mục
- `src/configs`: Cấu hình database và các biến môi trường.
- `src/controllers`: Xử lý logic nghiệp vụ cho các API.
- `src/models`: Định nghĩa các bảng và mối quan hệ database (Sequelize).
- `src/routes`: Định nghĩa các endpoint API.
- `src/middlewares`: Các hàm trung gian xử lý request.

## Yêu cầu
- Node.js (v14+)
- MySQL Server

## Hướng dẫn cài đặt

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```

2. Cài đặt các thư viện:
   ```bash
   npm install
   ```

3. Cấu hình file `.env`:
   - Tạo file `.env` từ file mẫu (nếu có) hoặc copy nội dung sau:
   ```env
   PORT=3000
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=restaurant_db
   DB_DIALECT=mysql
   NODE_ENV=development
   ```

4. Chạy ứng dụng:
   - Chế độ phát triển (tự động reload):
     ```bash
     npm run dev
     ```
   - Chế độ Production:
     ```bash
     npm start
     ```

## API Endpoints mẫu
- `GET /`: Kiểm tra server.
- `POST /api/users/register`: Đăng ký tài khoản.
- `GET /api/users/profile`: Lấy thông tin profile.

## Admin web

Trang admin tĩnh được phục vụ trực tiếp từ backend tại:

- `http://localhost:3000/admin`

Tài khoản seed mặc định:

- Username: `admin`
- Password: `123`

## Swagger UI

Sau khi backend chạy, mở giao diện quản lý và kiểm thử endpoint tại:

- `http://localhost:3000/api-docs/`

OpenAPI JSON có thể tải trực tiếp tại:

- `http://localhost:3000/api-docs.json`

Với endpoint cần xác thực, chọn **Authorize** trong Swagger UI và nhập:

```text
Bearer <JWT_TOKEN>
```
