# Hướng dẫn tạo mã QR cho bàn ăn (QR Ordering Guide)

Tài liệu này hướng dẫn cách tạo và quản lý mã QR đặc trưng cho từng bàn để phục vụ tính năng quét QR đặt món.

## 1. Định dạng dữ liệu mã QR

Để ứng dụng di động có thể nhận diện và truy vấn thông tin bàn, mã QR nên chứa một chuỗi định danh duy nhất (Unique Identifier).

**Khuyến nghị sử dụng chuỗi Token đơn giản:**
Ví dụ: `TABLE_01`, `TABLE_02`, `Vip_01`,...

Chuỗi này sẽ được lưu vào cột `qrCode` trong bảng `restaurant_tables` của cơ sở dữ liệu.

## 2. Cách tạo mã QR

### Cách 1: Tạo thủ công (Cho số lượng bàn ít)
Bạn có thể sử dụng các trang web tạo mã QR trực tuyến:
- [QR Code Generator](https://www.qr-code-generator.com/)
- [The QR Code Generator](https://www.the-qrcode-generator.com/)

**Các bước:**
1. Chọn loại nội dung là **Text**.
2. Nhập mã định danh bàn (ví dụ: `TABLE_01`).
3. Tải xuống hình ảnh QR và dán vào bàn tương ứng.

### Cách 2: Tạo bằng Script Node.js (Cho số lượng bàn lớn)
Bạn có thể sử dụng thư viện `qrcode` trong Node.js để tạo hàng loạt.

**Cài đặt:**
```bash
npm install qrcode
```

**Code ví dụ (`generateQR.js`):**
```javascript
const QRCode = require('qrcode');
const fs = require('fs');

const tables = [
    { id: 1, code: 'TABLE_01' },
    { id: 2, code: 'TABLE_02' },
    // Thêm các bàn khác...
];

if (!fs.existsSync('./qr_codes')) fs.mkdirSync('./qr_codes');

tables.forEach(table => {
    QRCode.toFile(`./qr_codes/${table.code}.png`, table.code, {
        color: {
            dark: '#000000',
            light: '#FFFFFF'
        }
    }, function (err) {
        if (err) throw err;
        console.log(`Đã tạo xong mã QR cho ${table.code}`);
    });
});
```

## 3. Quy trình Backend xử lý QR

Khi người dùng quét mã QR từ App, quy trình diễn ra như sau:

1. **Quét mã:** App lấy được chuỗi từ QR (VD: `TABLE_01`).
2. **Gọi API:** App gọi endpoint `GET /api/tables/qr/TABLE_01`.
3. **Xử lý tại Server:** 
   - Server tìm trong database xem có bàn nào có `qrCode = 'TABLE_01'` không.
   - Trả về thông tin bàn (`id`, `tableNumber`, `status`).
4. **Đặt món:** Khi người dùng chọn món và nhấn đặt, App gửi `table_id` lấy được từ bước trên lên `POST /api/orders`.

## 4. Cấu trúc bảng Database (`restaurant_tables`)

Đảm bảo dữ liệu trong database khớp với mã QR đã in:

| id | tableNumber | qrCode | status |
|----|-------------|--------|--------|
| 1  | 1           | TABLE_01 | AVAILABLE |
| 2  | 2           | TABLE_02 | AVAILABLE |

---
**Lưu ý:** Để bảo mật hơn, chuỗi trong QR có thể là một mã băm (Hash) hoặc UUID để tránh việc khách hàng đoán được mã của bàn khác (Ví dụ: `550e8400-e29b-41d4-a716-446655440000`).
