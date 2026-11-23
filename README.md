# QLSV Oracle — Website quản lý sinh viên

Ứng dụng quản lý sinh viên sử dụng **Spring Boot (Java 21)**, **Next.js 16 / React 19** và **Oracle Database**.

## 1. Công nghệ và yêu cầu

Cài đặt các công cụ sau trước khi chạy dự án:

- Git
- JDK 21
- Apache Maven 3.9 trở lên
- Node.js 20.9 trở lên và npm
- Oracle Database Free 23ai/26ai, listener cổng `1521`
- Oracle SQL Developer (để tạo schema và chạy script SQL)

Cấu hình Oracle mặc định của dự án:

- Host: `localhost`
- Port: `1521`
- Service/PDB: `FREEPDB1`
- Schema: `QLSV`

## 2. Clone dự án

Mở CMD hoặc Terminal tại thư mục muốn lưu mã nguồn:

```cmd
git clone https://github.com/mingne25/Java-Oracle.git
cd Java-Oracle
git switch main
```

Nếu đã clone từ trước, cập nhật code mới nhất:

```cmd
cd /d <duong-dan>\Java-Oracle
git switch main
git pull --ff-only origin main
```

## 3. Chuẩn bị cơ sở dữ liệu Oracle

### 3.1. Tạo schema QLSV

Nếu chưa có user `QLSV`, mở SQL Developer và kết nối bằng tài khoản `SYSTEM` tới đúng PDB `FREEPDB1`. Mở và chỉnh mật khẩu trong `database/00_create_user.sql`, sau đó chạy script một lần.

Không tạo lại user nếu `QLSV` đã tồn tại.

### 3.2. Tạo các bảng nền

Tạo kết nối SQL Developer mới:

- Username: `QLSV`
- Password: mật khẩu đã đặt
- Host: `localhost`
- Port: `1521`
- Service name: `FREEPDB1`

Chạy `database/01_schema.sql` **một lần trên schema QLSV trống**. Không chạy lại trên cơ sở dữ liệu đã có bảng vì script tạo mới các bảng.

Có thể chạy `database/02_seed_demo.sql` nếu muốn nạp dữ liệu mẫu; chỉ chạy sau khi tạo schema và kiểm tra nội dung script trước khi thực hiện.

### 3.3. Lưu ý về các script nâng cấp

- `03_classroom_teacher_assignment.sql` và `04_subject_enrollments.sql` là script nâng cấp cho một số schema cũ. Không chạy chúng trên schema mới đã tạo đầy đủ bằng `01_schema.sql`.
- `05_schedule_attendance.sql` và `06_attendance_status_update.sql` là các script lịch học/điểm danh đang có trong repository. **Cấu trúc bảng ATTENDANCE trong các script này chưa đồng bộ với model điểm danh hiện tại của ứng dụng** (ứng dụng hiện dùng `STUDENT_ID` và `CLASSROOM_ID`, không dùng `STUDENT_SUBJECT_ID`).
- Vì vậy, không tự ý chạy các script 05/06 để nâng cấp một cơ sở dữ liệu đang sử dụng. Cần có migration điểm danh mới tương ứng với phiên bản code hiện tại trước khi dựng mới hoặc nâng cấp database để dùng đầy đủ chức năng lịch học và điểm danh.

Nếu bạn đang sử dụng database đã được nâng cấp và kiểm thử theo phiên bản hiện tại, giữ nguyên database đó; không chạy lại các script tạo bảng/migration.

## 4. Chạy Backend (CMD)

Mở cửa sổ CMD thứ nhất:

```cmd
cd /d <duong-dan>\Java-Oracle\backend

set "SPRING_DATASOURCE_URL=jdbc:oracle:thin:@//localhost:1521/FREEPDB1"
set "SPRING_DATASOURCE_USERNAME=QLSV"
set "SPRING_DATASOURCE_PASSWORD=<mat-khau-QLSV>"
set "ADMIN_USERNAME=admin"
set "ADMIN_PASSWORD=<mat-khau-admin-manh>"

mvn spring-boot:run
```

Thay các giá trị trong dấu `<>` bằng thông tin thực tế. Không đưa mật khẩu thật lên Git hoặc chia sẻ công khai.

Backend chạy tại:

- API kiểm tra trạng thái: http://localhost:8080/api/health

Nếu CMD không nhận lệnh `mvn`, hãy cài Apache Maven và thêm thư mục `bin` của Maven vào biến môi trường `PATH`.

**Tài khoản Admin:** ứng dụng tạo tài khoản Admin lần đầu theo `ADMIN_USERNAME` và `ADMIN_PASSWORD` khi khởi động backend nếu chưa có tài khoản Admin. Mật khẩu được mã hóa BCrypt. Nếu Admin đã được tạo trước đó, thay đổi biến môi trường không tự đổi mật khẩu của tài khoản hiện có.

## 5. Chạy Frontend (CMD khác)

Mở cửa sổ CMD thứ hai:

```cmd
cd /d <duong-dan>\Java-Oracle\frontend
npm install
npm run dev
```

Mở trình duyệt tại:

http://localhost:3000

Đăng nhập bằng tài khoản được tạo trong hệ thống. Frontend mặc định gọi Backend tại `http://localhost:8080`. Nếu Backend dùng địa chỉ khác, cấu hình biến `NEXT_PUBLIC_API_URL` trước khi chạy/build Frontend.

## 6. Kiểm tra nhanh

1. Đảm bảo Oracle Database đang chạy và PDB `FREEPDB1` ở trạng thái `READ WRITE`.
2. Khởi động Backend và kiểm tra http://localhost:8080/api/health.
3. Khởi động Frontend và truy cập http://localhost:3000.
4. Đăng nhập bằng tài khoản Admin.
5. Nếu Backend không khởi động, xem thông báo lỗi trong cửa sổ CMD; lỗi thường gặp gồm sai thông tin kết nối Oracle, thiếu bảng/cột hoặc database chưa được nâng cấp đúng phiên bản.

## 7. Chức năng chính

- Quản lý khóa học, khoa, lớp hành chính, môn học, giảng viên và sinh viên.
- Phân công giảng viên phụ trách lớp và giảng dạy môn học của lớp.
- Nhập danh sách sinh viên từ file Excel.
- Quản lý thời khóa biểu tuần và tạo các buổi học cụ thể từ lịch tuần.
- Tạo buổi học độc lập, chỉnh sửa hoặc hủy buổi học.
- Giảng viên xem các lớp/môn được phân công và điểm danh sinh viên thuộc lớp hành chính.
- Phân quyền Admin, Giảng viên và Sinh viên.

Quy tắc nghiệp vụ: sinh viên thuộc lớp hành chính được học các môn được mở/phân công cho lớp đó; sinh viên không tự đăng ký môn học riêng lẻ. Sĩ số tối đa của lớp hành chính là 50 sinh viên.

## 8. Kiểm thử

Backend:

```cmd
cd backend
mvn clean test
```

Frontend:

```cmd
cd frontend
npm run build
```

## 9. Lưu ý

Đây là dự án học tập/MVP, cấu hình mặc định hướng tới chạy local. Không triển khai trực tiếp lên Internet hoặc môi trường production nếu chưa rà soát bảo mật, quản lý secrets, session/CSRF, phân trang, logging, sao lưu và kiểm thử triển khai.
