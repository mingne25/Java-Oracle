# Lịch học và điểm danh

Triển khai trên nhánh `Ngamina`. Quy ước nghiệp vụ:
- Admin tạo/cập nhật thời khóa biểu tuần và buổi học cụ thể; Admin có thể hủy buổi học.
- Giảng viên chỉ xem lịch thuộc các phân công môn học của chính mình và điểm danh sinh viên đã đăng ký môn đó.
- Trạng thái điểm danh: `PRESENT`, `ABSENT`, `LATE`. Không có trạng thái `EXCUSED`.
- Thời gian lưu dưới dạng số phút tính từ 00:00. Ví dụ 07:30 = 450.
- Thứ trong tuần: 2 = Thứ Hai, ..., 8 = Chủ nhật.

## API Admin

### Tạo thời khóa biểu tuần
`POST /api/admin/schedules/weekly`

```json
{
  "classroomSubjectId": 1,
  "dayOfWeek": 2,
  "startMinute": 420,
  "endMinute": 540,
  "room": "A101",
  "effectiveFrom": "2026-11-23",
  "effectiveTo": null
}
```

### Xem thời khóa biểu tuần
`GET /api/admin/schedules/weekly`

### Cập nhật thời khóa biểu tuần
`PUT /api/admin/schedules/weekly/{id}`

Dùng cùng cấu trúc JSON với API tạo lịch.

### Tạo buổi học cụ thể
`POST /api/admin/schedules/sessions`

```json
{
  "classroomSubjectId": 1,
  "weeklyScheduleId": 1,
  "sessionNo": 1,
  "sessionDate": "2026-11-23",
  "startMinute": 420,
  "endMinute": 540,
  "room": "A101",
  "note": null
}
```

Để tạo buổi học độc lập, truyền `weeklyScheduleId: null`.

### Xem buổi học
`GET /api/admin/schedules/sessions?from=2026-11-23&to=2027-02-21`

### Cập nhật buổi học
`PUT /api/admin/schedules/sessions/{id}`

Dùng cùng cấu trúc JSON với API tạo buổi học.

### Hủy buổi học
`PUT /api/admin/schedules/sessions/{id}/cancel`

## API Giảng viên

### Xem thời khóa biểu tuần
`GET /api/teacher/schedule/weekly`

### Xem các buổi học trong khoảng ngày
`GET /api/teacher/sessions?from=2026-11-23&to=2027-02-21`

Khoảng truy vấn tối đa sáu tháng.

### Xem sinh viên thuộc buổi học
`GET /api/teacher/sessions/{sessionId}/students`

### Lưu điểm danh
`POST /api/teacher/sessions/{sessionId}/attendance`

```json
[
  {
    "studentSubjectId": 12,
    "status": "PRESENT",
    "note": null
  },
  {
    "studentSubjectId": 13,
    "status": "ABSENT",
    "note": "Vắng"
  },
  {
    "studentSubjectId": 14,
    "status": "LATE",
    "note": null
  }
]
```

Gửi lại cùng sinh viên trong cùng buổi sẽ cập nhật bản ghi điểm danh hiện có, không tạo bản ghi thứ hai.

### Xem kết quả điểm danh
`GET /api/teacher/sessions/{sessionId}/attendance`

## Kiểm tra quyền và dữ liệu

- Endpoint Admin được bảo vệ bởi `ROLE_ADMIN`; endpoint giảng viên bởi `ROLE_TEACHER`.
- Mã giảng viên lấy từ tài khoản đăng nhập, không nhận từ request body.
- Giảng viên không thể xem/điểm danh buổi học không thuộc phân công của mình.
- Sinh viên phải có đăng ký môn học thuộc đúng lớp-môn của buổi học.
- Không cho phép điểm danh buổi đã hủy.
- Oracle giữ ràng buộc duy nhất một bản ghi cho mỗi cặp buổi học và đăng ký môn học.
