# Kiểm tra frontend IoT — 31/10/2026

Đã hoàn tất 16 smoke test trên Chromium, TypeScript, build và 22 test dữ liệu/realtime/hiển thị.

## Phạm vi đã kiểm tra

- Tổng quan: nhãn tiếng Việt, số đo S1 gần nhất, hai biểu đồ tròn khi chọn cảm biến cửa.
- Cảnh báo: sự kiện lưu cập nhật danh sách, chi tiết hiển thị trạng thái và ngày giờ dễ đọc.
- Sự cố: danh sách và chi tiết nhận sự kiện riêng, không tải lại danh sách thiết bị.
- Đặc tính và điều kiện cảnh báo: nhận cập nhật Profile/Rule, không gọi lại số đo.
- Lịch sử thao tác: nhận cập nhật Command và hiển thị kết quả bằng tiếng Việt.
- Sự kiện/lịch sử cửa tách thành hai tab, dữ liệu cũ vẫn được giữ khi lỗi đọc tạm thời.
- Chu kỳ đọc số đo 60 giây; sự kiện Alarm/Rule không tạo thêm lượt đọc số đo.
- Có trạng thái kết nối cập nhật tự động và kiểm tra định kỳ dự phòng.
- Màn hình 390px: bảng sự kiện nằm trong khung; điều hướng tab bằng bàn phím hoạt động.
- Không có lỗi JavaScript chưa được xử lý trong các tình huống kiểm tra.

## Giới hạn của bằng chứng

Smoke test sử dụng API dữ liệu mẫu và máy chủ Socket.IO thật chạy cục bộ. Test không đăng nhập,
không lưu hay thay đổi Device/Alarm/Incident trên hệ thống thật. Kết quả xác nhận cách frontend xử lý
sự kiện và hiển thị; việc phát sự kiện, quyền đăng ký theo dõi và kết nối trên môi trường thật vẫn
phụ thuộc dịch vụ đang chạy. Các API chỉ đọc hiện có được giữ nguyên.

Số đo S1 hiện đọc giá trị gần nhất; không bổ sung nguồn lịch sử số đo mới.

## Tệp kết quả

- [16 tình huống kiểm tra](docs/smoke-2026-10-31/report.json)
- [Ảnh Tổng quan](docs/smoke-2026-10-31/dashboard-desktop.png)
- [Ảnh điện thoại](docs/smoke-2026-10-31/device-mobile.png)

## Chạy lại

Kiểm tra dữ liệu và kiểu:

```bash
npm test
node node_modules/typescript/bin/tsc --project tsconfig.json
npm run build
```

Smoke test dùng công cụ cài riêng trong /tmp, không thêm dependency vào ứng dụng:

```bash
npm install --prefix /tmp/nextgrp-frontend-smoke --no-audit --no-fund playwright socket.io
PLAYWRIGHT_BROWSERS_PATH=/tmp/nextgrp-playwright-browsers /tmp/nextgrp-frontend-smoke/node_modules/.bin/playwright install chromium
PUBLIC_SOCKET_URL=http://127.0.0.1:39200 PUBLIC_SOCKET_NAMESPACE=/nextgrp.localhost PUBLIC_FRAPPE_URL=http://127.0.0.1:39199 npm run build
NODE_PATH=/tmp/nextgrp-frontend-smoke/node_modules PLAYWRIGHT_BROWSERS_PATH=/tmp/nextgrp-playwright-browsers npm run test:smoke
```

Hai cổng 39199 và 39200 cần trống. Build trên dùng địa chỉ máy chủ giả lập, chỉ dành cho kiểm thử;
chạy lại `npm run build` không kèm các biến trên trước khi dùng bản build cho ứng dụng thật.
