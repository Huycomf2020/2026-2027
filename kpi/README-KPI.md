# KPI Trường THPT Lộc Ninh, năm học 2026–2027

Bản nâng cấp gồm giao diện `luonghoa.html`, backend Apps Script riêng và 59 nhiệm vụ từ 5 tab Excel. Đây là bộ mã cần triển khai đồng thời. Việc cập nhật GitHub không tự cập nhật Apps Script hoặc Google Sheet.

## Triển khai đúng backend

1. Mở Google Sheet `Luong_hoa_26_27` chứa danh sách `gvcnv`. Chọn **Tiện ích mở rộng → Apps Script**. Xác định đúng dự án đã triển khai URL đang dùng trong `kpi/app.js`. Không thay `Code.gs` điểm danh của Đoàn trường ở repo này: đó là ứng dụng khác.
2. Sao lưu dự án Apps Script và Google Sheet. Trong dự án KPI, thay bộ backend cũ bằng ba tệp: `KpiBackend.gs`, `KpiCore.gs`, `KpiCatalog.gs`. Không để trùng các hàm `doGet`, `doPost` và các tên hàm KPI. Nếu dự án đang dùng chung ứng dụng khác, tạo dự án riêng và cập nhật API_URL thay vì ghi đè router của ứng dụng đó.
Có thể thay bước 2 bằng **một tệp** `KPI-Combined.gs` (bản ghép sẵn). Không cài đồng thời bản ghép và 3 tệp rời.

3. Nếu script không gắn với spreadsheet, đặt Script Property `KPI_SPREADSHEET_ID` bằng ID bảng tính thật. Đặt múi giờ dự án là Asia/Ho_Chi_Minh. Chạy `initializeKpiSystem` một lần, cấp quyền Sheets/Drive cần thiết. Hàm có thể chạy lại, không xóa sheet cũ, không đổi mật khẩu hiện tại, không ghi đè schema khác.
4. Kiểm tra danh sách `gvcnv`: Email duy nhất; Họ và tên; Chức vụ; Môn; Mật khẩu hiện tại. Các cột bổ sung: **Tổ**, **Nhóm nhiệm vụ tương đồng**, **Lớp chủ nhiệm**, **Hòa nhập**, **Vai trò KPI**, **Mật khẩu hash**, **Salt KPI**, **Phiên bản mật khẩu**. Điền Tổ chuẩn thống nhất; Môn chỉ là giá trị dự phòng, không thay được tổ ghép nhiều môn.
5. Vai trò tự nhận từ Chức vụ: Tổ viên/Giáo viên → GVBM; Tổ trưởng → GVBM,TTCM; Tổ phó → GVBM,TPCM; Hiệu trưởng → HT; Phó Hiệu trưởng → PHT. Lớp chủ nhiệm có dữ liệu → thêm GVCN; Hòa nhập = Có/TRUE/1/X → thêm HOANHAP. Với phân công phức tạp, điền **Vai trò KPI** rõ ràng, ví dụ `GVBM;GVCN;TPCM;HOANHAP`. Không thể suy ra GVCN/hòa nhập từ ảnh danh sách chỉ có Chức vụ và Môn.
6. HT/PHT/nhân viên chưa có danh mục trong nguồn Excel. Dùng đăng ký nhiệm vụ bổ sung đúng kế hoạch được giao; không gán bộ nhiệm vụ giáo viên cho lãnh đạo chỉ để có điểm. Cấp quản lý trực tiếp khác xét duyệt, không tự duyệt. Kết quả đánh giá lãnh đạo cuối cùng cần quyết định của cấp có thẩm quyền.
7. Chọn **Triển khai → Quản lý triển khai → Chỉnh sửa → Phiên bản mới**, giữ URL `/exec` hiện tại. Web app chạy dưới tài khoản quản lý có quyền với bảng và thư mục Drive. Đối tượng truy cập phải cho phép trang GitHub gửi yêu cầu; dữ liệu riêng vẫn phải qua xác thực và kiểm tra quyền server. Nếu tạo deployment mới, sửa API_URL trong `kpi/app.js`.
8. Mở URL `/exec?action=kpiPublic` để kiểm tra phản hồi có `version: 2026.10.04`. Sau đó hợp nhất PR để GitHub Pages nhận giao diện mới. Đăng nhập bằng tài khoản thử trong đúng Sheet và xác minh đầy đủ quy trình bên dưới trước khi sử dụng chính thức.

## Sheet được bổ sung

- `bang_luong_hoa_kpi`: danh mục chuẩn, có mã, vai trò, sản phẩm, loại, điểm chuẩn, hệ số và nguồn dòng Excel.
- `kpi_cong_viec`: đăng ký/giao việc, thời hạn, đầu ra, thuộc kế hoạch A, tự chấm, kết quả duyệt, phiên bản và minh chứng.
- `kpi_chung`: 6 nhóm tự chấm/duyệt, tổng tối đa 30.
- `kpi_thuong`: đề xuất, căn cứ, nhiệm vụ liên quan và điểm duyệt.
- `kpi_xep_loai`: kết quả từ quyết định/biên bản, do BGH ghi nhận. App không tự quyết định mức xếp loại.
- `kpi_ket_qua`: bảng tổng hợp vật hóa; chạy `refreshKpiResults` để làm mới. App/báo cáo luôn tính lại trực tiếp từ hồ sơ, không phụ thuộc bảng này.
- `kpi_nhat_ky`: người thực hiện, trước/sau, thời điểm thay đổi.
- `kpi_cau_hinh`: kỳ, quy chế áp dụng, chế độ thưởng, thư mục Drive, cơ chế quá hạn.

Các sheet cũ `diem_thi_dua`, `bang_luong_hoa` giữ nguyên để đối chiếu. Không cộng điểm thành tích cũ vào KPI mới vì thiếu giao việc, hệ số, tiến độ/chất lượng và trạng thái duyệt. Chuyển hồ sơ cũ qua nhiệm vụ đã được kiểm tra, không coi số điểm cũ là KPI mặc định.

## Công thức và những điểm đã hiệu chỉnh

- Công việc thường xuyên 10 điểm; đột xuất 12; hệ số 1,0 / 1,1 / 1,2.
- Điểm thực hiện = chuẩn × (0,3 × tiến độ/100 + 0,7 × chất lượng/100).
- Quy đổi = ROUND(điểm thực hiện × hệ số, 2), tối đa chuẩn × hệ số.
- A là điểm tối đa kế hoạch đã duyệt, cập nhật khi hủy công việc. B là điểm thực tế các nhiệm vụ đã duyệt gồm phát sinh. KPI = min(70, B/A × 70). A=0 hoặc chưa duyệt điểm chung: tổng chưa đủ dữ liệu, không xếp hạng.
- Nhiệm vụ chưa chấm vẫn nằm trong A; không biến mất khỏi mẫu số. Điểm tự chấm chưa duyệt chưa nằm trong B. Cơ chế tự duyệt quá hạn chỉ áp dụng khi trường bật cấu hình.
- Excel GVBM hàng 16,17: loại đột xuất nên sửa chuẩn 10 thành 12; hệ số 1,1 → 13,2 điểm. GVBM hàng 17 trước ghi tối đa 10 không khớp. `source-corrections.json` ghi cả hai sai lệch.
- Ví dụ tính PL5 có các hàng không nhất quán: công việc chuẩn12, hệ số1,1, tiến độ80%, chất lượng80% phải đạt 10,56, không phải 8,80. Không sao chép tổng mô phỏng sai; dùng công thức định nghĩa trong phụ lục.
- Thưởng theo nguồn: 5% phần đóng góp KPI của nhiệm vụ, diễn giải triển khai = 5% × (quy đổi thực tế nhiệm vụ / A ×70). Giới hạn thưởng cả kỳ = min(7,10% KPI thực đạt). Đây là diễn giải để thống nhất đơn vị điểm, cần nhà trường xác nhận vì câu chữ/ ví dụ nguồn chưa hoàn toàn nhất quán.
- Điểm tổng = min(100, KPI70 + tiêu chí chung30 + thưởng). Không cộng thưởng hai lần vào B và tổng.
- Xuất sắc: tổng≥90, hoàn thành100% việc, vượt yêu cầu≥30% việc. Vượt: ngày hoàn thành trước hạn, tiến độ100%, chất lượng100%. Đây mới là đủ điều kiện đề xuất; hội đồng vẫn biểu quyết/quyết định. BGH xác định cột Nhóm nhiệm vụ tương đồng; khi chốt XS app kiểm tra XS≤floor(20% × số HTT đã chốt) trong đúng nhóm, không tự lấy20% mọi người trên bảng. Chốt các kết quả HTT trước, sau đó xét XS; sửa kết quả làm vượt giới hạn sẽ bị từ chối. Bảng xếp hạng ưu tiên KPI công việc, sau đó điểm tổng.
- 6 tiêu chí chung ×5 là phân bổ **đề xuất trường** vì chưa có Mẫu1A/1B hoàn chỉnh trong nguồn. Không coi là nguyên văn tiêu chí chính thức.

## Quy chế thưởng kỳ thi đề xuất

Mặc định `bonusMode=source`: chỉ duyệt nổi trội/sáng kiến đáp ứng PL5. Sau khi ban hành quy chế riêng, đổi `bonusMode=school`:

| Thành tích | Điểm đề xuất tối đa |
|---|---:|
| Tỷ lệ tốt nghiệp môn bằng Thành phố | 1 |
| Tỷ lệ tốt nghiệp môn cao hơn Thành phố | 2 |
| HSG / QPAN / Hội thao cấp Thành phố — Nhất | 3 |
| Nhì | 2 |
| Ba | 1,5 |
| Khuyến khích | 1 |

Hai mức tốt nghiệp chọn một. So sánh cùng môn, năm thi, cùng khái niệm tỷ lệ, ghi số dự thi/số đạt và nguồn thống kê Thành phố; không dùng điểm trung bình thay cho tỷ lệ. Nếu nhiệm vụ chung nhiều giáo viên, điểm được duyệt không vượt mức trên và phải phân chia theo quyết định phân công, tổng phần chia không vượt thưởng của cùng thành tích. Người duyệt chịu trách nhiệm kiểm tra đối chiếu giải/quyết định, không đăng ký hai lần cùng kết quả, không cộng lại thưởng PL5 cho chính thành tích đã thưởng theo trường. App chống trùng nhiệm vụ/người và căn cứ giống nhau, nhưng không thể nhận ra mọi cách diễn đạt khác nhau của cùng một thành tích.

Giới hạn **min(7,10% KPI)** áp dụng trong cả hai chế độ, không tự trao đủ7 điểm cho mọi giáo viên. Không có tệp đính kèm vẫn có thể kê khai; cần căn cứ/nhận xét xác nhận, không bắt buộc upload.

## Quy trình năm học

1. BGH thống nhất quy chế áp dụng tại Đồng Nai, kỳ đánh giá, phân công và nhóm nhiệm vụ tương đồng. Tài liệu cung cấp là CV9421/SGDĐT-TCCB **TP.HCM**, ngày10/9/2026, **quýIII/2026**; không phải văn bản đương nhiên áp dụng cả năm học ở Đồng Nai.
2. Người dùng đăng ký danh mục đúng nhiệm vụ, đầu ra và ngày hạn cụ thể; các việc lặp lại cùng bản chất tổng hợp thành1 nhiệm vụ. Quản lý kiểm tra **đầy đủ nhiệm vụ được giao**, không duyệt mẫu số A quá thấp do giáo viên chỉ chọn việc thuận lợi. Tránh trùng GVBM-8 với hồ sơ Hòa nhập bằng tách sản phẩm/ trách nhiệm cụ thể.
3. TTCM/BGH duyệt danh mục và hệ số tại lúc giao việc. Công việc ngoài kế hoạch chỉ nằm B sau khi duyệt thực hiện. Nhiệm vụ phát sinh thuộc chức năng thường xuyên không tự coi đột xuất; dùng nhiệm vụ bổ sung loại thường xuyên.
4. Người dùng kê khai ngày hoàn thành, tiến độ, chất lượng, kết quả và minh chứng tùy chọn. Tiến độ chọn theo **ngày làm việc thực tế của trường**, có xét lịch nghỉ, không đếm đơn thuần ngày lịch. Trường hợp khách quan/điều chỉnh hạn phải có căn cứ và người quản lý xét duyệt.
5. Người quản lý duyệt/điều chỉnh hoặc trả lại. Hồ sơ đã duyệt không cho giáo viên sửa trực tiếp. Thay đổi có kiểm tra phiên bản chống ghi đè cùng lúc và nhật ký trước/sau.
6. Thưởng riêng có xác nhận điều kiện nguồn hoặc quy chế trường. Tiêu chí chung tự chấm, sau đó quản lý duyệt.
7. Hội đồng xem điều kiện, tỷ lệ XS, biểu quyết và ban hành kết quả. BGH ghi số quyết định và xếp loại. Không tự duyệt bản thân. HT/PHT phải được đánh giá theo thẩm quyền quản lý thực tế; tính điểm không thay cho thẩm quyền đó.
8. Xuất Excel/PDF trong tab Quản lý. HT/PHT: toàn trường; TTCM: mọi nhân sự cùng Tổ. PDF mở bản in A4, Times New Roman13, lề trái30mm, phải/trên/dưới20mm; chọn **In → Lưu thành PDF**, kiểm tra chia trang và số trang đầu trang. Excel .xlsx có tổng hợp, nhiệm vụ, tiêu chí chung, thưởng, công thức quy đổi và vùng ký. Thư viện ExcelJS4.4.0 tải từ CDN, cần kết nối mạng.

### Tự duyệt quá hạn theo nguồn (tùy chọn sau khi ban hành)

Mặc định `autoTimeout=false`, dùng duyệt rõ ràng vì quy chế năm học của trường chưa được cung cấp. Nếu trường chính thức áp dụng cơ chế nguồn 3ngày duyệt giao việc và7ngày duyệt tự đánh giá, đổi `autoTimeout=true` và chạy `installKpiTimeoutTrigger`. Trigger kiểm tra mỗi giờ; ghi `SYSTEM-TIMEOUT` trong nhật ký. Không tự duyệt điểm thưởng, tiêu chí chung hoặc xếp loại. Các mốc3/7ngày dùng ngày lịch theo câu chữ nguồn; cần sửa nếu văn bản áp dụng của trường quy định khác.

## Bảo mật và nghiệm thu

- Không đưa tài khoản, mật khẩu hoặc ảnh danh sách chứa mật khẩu vào GitHub. Email/tổ/tên người dùng chỉ đọc từ Sheet có quyền server. Public API chỉ trả danh mục/cấu hình.
- Login/đổi mật khẩu gửi POST, không đưa mật khẩu/digest vào URL. Sau lần đăng nhập đầu tiên, mật khẩu cũ trong cột plaintext được chuyển sang HMAC-SHA256 của digest có salt và pepper (Script Property), và xóa giá trị plaintext. Không phải PBKDF2; nếu triển khai quy mô lớn, thay bằng Identity Provider chuyên dụng. Digest đăng nhập phải được bảo vệ như mật khẩu.
- Đổi mật khẩu lưu hash về gvcnv, tăng phiên bản để thu hồi các phiên cũ. Token ngẫu nhiên, thời hạn6giờ trong CacheService; cache có thể hết trước hạn, khi đó đăng nhập lại. Không lưu token vào localStorage. Bản sao lưu phải giữ `KPI_PEPPER`; mất pepper không thể xác thực các hash hiện có.
- Upload đặt tên **Họ và tên_Tổ_Nội dung.ext** theo MIME; tối đa10MB. Giữ quyền Drive hiện có, không tự bật công khai. Nếu giáo viên cần xem lại tệp, quản lý chia sẻ thư mục phù hợp ngoài app. Bản báo cáo ghi tên tệp và đường dẫn nhưng không tự nới quyền.
- Dữ liệu phản hồi POST chuyển qua vé ngẫu nhiên và các chunk cache5phút. Request lớn/báo cáo rất đông người có thể cần phân trang nếu chạm hạn mức Apps Script/cache. Không tự gửi lại mutations khi timeout để tránh ghi trùng.
- Test chạy: `node tests/core.test.js`, `node tests/backend.test.js`; kiểm tra cú pháp app/reports/backend. Tests dùng nhân sự giả, không chạm Google Sheet thật. `tests/ui.test.js` cần Playwright Chromium; chưa chạy được tại môi trường này do thiếu binary. ExcelJS tải từ mạng và PDF qua cửa sổ in phải nghiệm thu trên máy sử dụng.
- Nghiệm thu thực tế:1tài khoảnGVBM,1GVCN,1TPCM,1TTCM,1hòa nhập vàBGH; đăng ký/duyệt, chưa hoàn thành, trả lại, thưởng, đổi mật khẩu/đăng nhập lại, upload không tệp/có tệp, tổ trưởng không xem tổ khác, xuất.xlsx/mởExcel và lưuPDF. Google Sheet/deployment thật chưa được cập nhật hay xác minh do kết nối bị chặn.
