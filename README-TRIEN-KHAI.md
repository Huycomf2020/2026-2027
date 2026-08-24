# Hệ thống Đoàn trường THPT Lộc Ninh

## Cài đặt lần đầu

1. Mở bảng tính `2026-2027` → **Tiện ích mở rộng → Apps Script**.
2. Dán nội dung `Code.gs` vào tệp cùng tên.
3. Tạo tệp HTML tên chính xác `index`, dán nội dung `index.html`.
4. Tạo tệp HTML tên chính xác `Assistant`, dán nội dung `Assistant.html`.
5. Trong **Project Settings**, đặt múi giờ `Asia/Ho_Chi_Minh`.
6. Chạy hàm `initializeSystem` một lần và cấp quyền. Hàm sẽ tạo/định dạng các sheet `quy_dinh`, `khoi_lop`, `thi_dua`, `hoat_dong_khac`, `dashboard`.
7. Chọn **Deploy → Manage deployments → Edit**, phiên bản **New version**, thực thi dưới tài khoản của bạn và đặt quyền truy cập phù hợp; sau đó **Deploy**.

## Chạy giao diện trên GitHub Pages

`index.html` tự động gọi Apps Script như một API khi được mở ngoài Apps Script. Trong GitHub, vào **Settings → Pages**, chọn **Deploy from a branch**, nhánh `main`, thư mục `/ (root)` rồi lưu. Không thay đổi hằng số `API_URL` trừ khi tạo deployment Apps Script mới.

## Dữ liệu

- `quy_dinh`: nhập nội dung và mức điểm trừ.
- `khoi_lop`: nhập STT, Họ và tên, Mã học sinh, Lớp. Các cột trạng thái/ngày/buổi tự cập nhật khi điểm danh.
- `hoat_dong_khac`: nhập điểm cộng, điểm trừ và ghi chú của từng lớp.
- `thi_dua` và `dashboard`: được làm mới khi lưu điểm danh hoặc chạy `refreshCompetition`.

## Trợ lý AI

Trong Apps Script, mở **Project Settings → Script Properties**, thêm khóa `GEMINI_API_KEY`. Khi mở lại Sheet, menu **🤖 Trợ lý Đoàn trường** sẽ xuất hiện.

## Bảo mật cần lưu ý

Mật khẩu điểm danh hiện là `Diemdanh@26` theo yêu cầu và nằm trong `Code.gs`. Với môi trường thực tế, nên chuyển mật khẩu sang Script Properties và bổ sung tài khoản riêng cho từng lớp.
