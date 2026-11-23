# UniVerse – QLSV Oracle (Tailwind CSS UI v2)

## Thiết lập

Yêu cầu Node.js 20.9+ (khuyến nghị Node 22), npm, backend Spring Boot chạy tại `http://localhost:8080`.

```powershell
cd E:\QLSV_Oracle_Fullstack\frontend
npm install
npm run dev
```

Mở http://localhost:3000. Để trỏ tới API khác, tạo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8080
```

Nếu sửa `.env.local`, khởi động lại `npm run dev`.

## Điểm mới
- Tailwind CSS v4 + PostCSS, không cần `tailwind.config.js`.
- Login gradient, sidebar responsive, dashboard thống kê, bảng dữ liệu có tìm kiếm phía client, modal CRUD.
- Role ADMIN: quản lý các danh mục và tài khoản. Role TEACHER: xem dashboard, sinh viên, giảng viên và hồ sơ. Role STUDENT: hồ sơ cá nhân.
- Giữ nguyên các endpoint Spring Boot hiện có, không đổi schema Oracle.

## Ghi chú
- Dashboard ADMIN dùng `/api/admin/stats`; dashboard TEACHER tính thống kê từ dữ liệu catalog được phép đọc.
- Basic Auth đang lưu ở sessionStorage theo kiến trúc backend hiện tại. Chỉ phù hợp chạy local/demo; triển khai thực tế nên chuyển sang đăng nhập dựa trên session HttpOnly cookie và HTTPS.
- Không có dữ liệu demo giả trên dashboard; cần chạy backend và seed database để có số liệu.
- Nếu frontend báo lỗi kết nối, kiểm tra Spring Boot, Oracle, CORS localhost:3000 và thông tin đăng nhập.
