# QLSV Oracle — Spring Boot + Next.js

Dự án **mới**, dựa trên nghiệp vụ trong `phan_tich_nghiep_vu_quan_ly_sinh_vien_oop.md` và công nghệ của dự án cũ. Không ghi đè dự án gốc.

## Yêu cầu
- Java 21, Maven, Node.js 20.9+ (khuyến nghị Node.js 22), npm
- Oracle Database Free 23ai/26ai, listener 1521, PDB `FREEPDB1`
- Oracle SQL Developer

## Thiết lập Oracle
1. Kết nối `SYSTEM` tới **FREEPDB1** (không phải root container).
2. Nếu chưa có user QLSV, sửa mật khẩu trong `database/00_create_user.sql` rồi chạy một lần. Nếu user QLSV đã tồn tại, chỉ cấp quyền/quota còn thiếu.
3. Tạo kết nối SQL Developer mới bằng user `QLSV` tới `FREEPDB1`.
4. Chạy `database/01_schema.sql` **một lần** trong schema trống QLSV. Đừng chạy lại nếu các bảng đã có.
5. Kiểm tra `SELECT TABLE_NAME FROM USER_TABLES;`.

## Backend (PowerShell)
```powershell
cd backend
$env:DB_PASSWORD="<mat-khau-QLSV>"
$env:ADMIN_USERNAME="admin"
$env:ADMIN_PASSWORD="<mat-khau-admin-manh>"
mvn spring-boot:run
```
Địa chỉ `http://localhost:8080/api/health`. Admin được tạo **một lần** khi chạy backend lần đầu, password được băm BCrypt. Không dùng SYSTEM làm tài khoản ứng dụng.

## Frontend (PowerShell khác)
```powershell
cd frontend
npm install
npm run dev
```
Truy cập `http://localhost:3000`, đăng nhập Admin từ biến môi trường ở trên.

## Thứ tự nhập dữ liệu
Khóa học → Khoa → Lớp → Môn học / Giảng viên → Sinh viên → Tạo tài khoản giảng viên và sinh viên.

## Quyền
- `ADMIN`: CRUD khóa, khoa, lớp, môn, giảng viên, sinh viên; tạo tài khoản Teacher/Student; dashboard.
- `TEACHER`: xem danh sách danh mục/sinh viên, xem hồ sơ cá nhân.
- `STUDENT`: xem danh mục và hồ sơ của chính mình.
- Không có đăng ký tài khoản công khai, không tạo thêm admin qua API.

## API
- `GET /api/health` (public)
- `GET /api/me` (đăng nhập)
- `GET /api/catalog/{years|faculties|classes|subjects|teachers|students}` (đăng nhập)
- `POST/PUT/DELETE /api/catalog/{type}` (Admin)
- `GET /api/admin/stats`, `POST /api/admin/users` (Admin)
- `GET /api/teacher/profile` (Teacher), `GET /api/student/profile` (Student)

## Giới hạn phiên bản bàn giao
Đây là **MVP có mã nguồn**, chưa phải sản phẩm triển khai công khai. HTTP Basic được lưu trong sessionStorage trình duyệt; chỉ dùng trên localhost để học tập, không triển khai internet như hiện tại. Cần nâng cấp lên session cookie HttpOnly + CSRF, kiểm soát quyền chi tiết theo khoa/lớp, pagination, xử lý ngoại lệ, transaction/locking chống đồng thời khi lớp gần đầy, audit log và automated tests trước khi sử dụng thật. Đặc biệt, API GET danh mục hiện cho phép sinh viên xem toàn bộ danh sách; nên thu hẹp theo nhu cầu bảo mật thực tế.

Giới hạn 50 được kiểm tra ở tầng service trong luồng thông thường; chưa có cơ chế khóa cạnh tranh an toàn khi nhiều request đồng thời. Chưa có module điểm danh/lịch học/điểm số vì tài liệu gốc không yêu cầu. Chưa triển khai báo cáo nâng cao, tìm kiếm kết hợp và CSV.
