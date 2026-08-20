# Customer QR ordering frontend

Giao diện khách hàng cho ứng dụng đặt món qua QR, tích hợp với backend ở đường dẫn `/api`.

## Chạy

- Khởi động backend: `cd backend && npm install && npm run dev`
- Mở giao diện khách hàng tại: `http://localhost:3000/customer`
- Nếu cần quét bàn qua QR, mở URL dạng: `http://localhost:3000/customer?qr=YOUR_QRCODE`

Khi frontend và backend deploy thành hai project Vercel riêng, đặt URL backend
trước khi dùng frontend:

```js
localStorage.setItem('appdatmon_api_base', 'https://YOUR-BACKEND.vercel.app');
location.reload();
```

Hoặc khai báo `window.APP_API_BASE_URL` trước khi nạp `js/app.js`. Không thêm
dấu `/` ở cuối URL.

## Tính năng

- Đăng ký / đăng nhập bằng API auth
- Xem danh sách món ăn từ API products
- Chọn bàn bằng QR code từ API tables
- Tạo đơn hàng sử dụng API orders
