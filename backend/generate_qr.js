/**
 * Script này dùng để tạo hàng loạt mã QR cho các bàn trong nhà hàng.
 * Bạn cần cài đặt thư viện 'qrcode' trước khi chạy:
 * npm install qrcode
 *
 * Chạy script:
 * node generate_qr.js
 */

const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

// Cấu hình danh sách bàn cần tạo mã
// Bạn có thể thay đổi danh sách này hoặc lấy từ Database
const tables = [
    { number: 1, qrCode: 'TABLE_01' },
    { number: 2, qrCode: 'TABLE_02' },
    { number: 3, qrCode: 'TABLE_03' },
    { number: 4, qrCode: 'TABLE_04' },
    { number: 5, qrCode: 'TABLE_05' },
    { number: 6, qrCode: 'TABLE_06' },
    { number: 7, qrCode: 'TABLE_07' },
    { number: 8, qrCode: 'TABLE_08' },
    { number: 9, qrCode: 'TABLE_09' },
    { number: 10, qrCode: 'TABLE_10' }
];

// Thư mục lưu trữ ảnh QR
const outputDir = path.join(__dirname, 'qr_codes');

// Tạo thư mục nếu chưa tồn tại
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
    console.log(`Đã tạo thư mục: ${outputDir}`);
}

/**
 * Hàm tạo QR code cho một bàn
 */
const generateQR = async (table) => {
    try {
        const fileName = `${table.qrCode}.png`;
        const filePath = path.join(outputDir, fileName);

        // Tạo QR Code và lưu vào file
        // Nội dung mã QR chính là chuỗi table.qrCode
        await QRCode.toFile(filePath, table.qrCode, {
            color: {
                dark: '#000000',  // Màu của QR (Đen)
                light: '#FFFFFF'  // Màu nền (Trắng)
            },
            width: 500, // Độ rộng ảnh (pixel)
            margin: 2   // Khoảng cách lề
        });

        console.log(`✅ Đã tạo thành công: Bàn ${table.number} -> ${fileName}`);
    } catch (err) {
        console.error(`❌ Lỗi khi tạo mã cho bàn ${table.number}:`, err);
    }
};

// Chạy vòng lặp tạo QR cho tất cả các bàn
const run = async () => {
    console.log('🚀 Đang bắt đầu tạo mã QR...');
    for (const table of tables) {
        await generateQR(table);
    }
    console.log('\n✨ Đã hoàn thành! Bạn có thể xem ảnh tại thư mục ./qr_codes');
};

run();
