package vn.edu.qlsv.controller;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.http.*;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import vn.edu.qlsv.model.*;
import vn.edu.qlsv.repository.ClassroomRepository;
import vn.edu.qlsv.repository.StudentRepository;

@RestController
@RequestMapping("/api/admin/import")
public class StudentImportController {
    private static final List<String> HEADERS = List.of(
            "code", "fullName", "dateOfBirth", "gender", "email", "phone", "status", "classroomCode");
    private static final List<StudentStatus> OCCUPYING = List.of(
            StudentStatus.STUDYING, StudentStatus.SUSPENDED, StudentStatus.RESERVED);

    private final StudentRepository students;
    private final ClassroomRepository classrooms;

    public StudentImportController(StudentRepository students, ClassroomRepository classrooms) {
        this.students = students;
        this.classrooms = classrooms;
    }

    record ImportRow(int row, String code, String fullName, LocalDate dateOfBirth,
            String gender, String email, String phone, StudentStatus status,
            Classroom classroom, List<String> errors) {
        boolean valid() { return errors.isEmpty(); }
    }

    private String cell(DataFormatter formatter, Row row, int index) {
        Cell value = row.getCell(index, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        return value == null ? "" : formatter.formatCellValue(value).trim();
    }

    private LocalDate parseDateOfBirth(Row row, DataFormatter formatter, List<String> errors) {
        Cell value = row.getCell(2, Row.MissingCellPolicy.RETURN_BLANK_AS_NULL);
        if (value == null) return null;

        try {
            if (value.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(value)) {
                return DateUtil.getLocalDateTime(value.getNumericCellValue()).toLocalDate();
            }

            String text = formatter.formatCellValue(value).trim();
            if (text.isBlank()) return null;
            try {
                return LocalDate.parse(text);
            } catch (DateTimeParseException ignored) {
                return LocalDate.parse(text, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
            }
        } catch (IllegalArgumentException ex) {
            errors.add("Ngày sinh phải theo dạng YYYY-MM-DD hoặc DD/MM/YYYY, hoặc là ô ngày tháng Excel");
            return null;
        }
    }

    private void checkLength(String value, int max, String label, List<String> errors) {
        if (value != null && value.length() > max) {
            errors.add(label + " không được vượt quá " + max + " ký tự");
        }
    }

    private List<ImportRow> parse(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("Vui lòng chọn file Excel.");
        String name = file.getOriginalFilename();
        if (name == null || !name.toLowerCase(Locale.ROOT).endsWith(".xlsx"))
            throw new IllegalArgumentException("Chỉ hỗ trợ file Excel .xlsx.");

        List<ImportRow> result = new ArrayList<>();
        Set<String> seenCodes = new HashSet<>();
        Map<Long, Long> additionsByClass = new HashMap<>();
        try (Workbook workbook = WorkbookFactory.create(file.getInputStream())) {
            if (workbook.getNumberOfSheets() == 0)
                throw new IllegalArgumentException("File Excel không có trang tính dữ liệu.");
            Sheet sheet = workbook.getSheetAt(0);
            if (sheet.getPhysicalNumberOfRows() < 1)
                throw new IllegalArgumentException("File Excel chưa có dòng tiêu đề.");
            DataFormatter formatter = new DataFormatter(Locale.forLanguageTag("vi-VN"));
            Row header = sheet.getRow(0);
            if (header == null)
                throw new IllegalArgumentException("File Excel chưa có dòng tiêu đề.");
            for (int i = 0; i < HEADERS.size(); i++) {
                if (!HEADERS.get(i).equalsIgnoreCase(cell(formatter, header, i)))
                    throw new IllegalArgumentException("Sai tiêu đề cột. Hãy tải file mẫu mới nhất trên website.");
            }

            for (int i = 1; i <= sheet.getLastRowNum(); i++) {
                Row row = sheet.getRow(i);
                if (row == null) continue;
                String code = cell(formatter, row, 0);
                String fullName = cell(formatter, row, 1);
                String genderText = cell(formatter, row, 3);
                String email = cell(formatter, row, 4);
                String phone = cell(formatter, row, 5);
                String statusText = cell(formatter, row, 6);
                String classroomCode = cell(formatter, row, 7);
                if (List.of(code, fullName, cell(formatter, row, 2), genderText, email, phone, statusText, classroomCode)
                        .stream().allMatch(String::isBlank)) continue;

                List<String> errors = new ArrayList<>();
                if (code.isBlank()) errors.add("Thiếu mã sinh viên");
                else {
                    String key = code.toUpperCase(Locale.ROOT);
                    if (!seenCodes.add(key)) errors.add("Mã sinh viên bị lặp trong file");
                    if (students.existsByCodeIgnoreCase(code)) errors.add("Mã sinh viên đã tồn tại");
                }
                if (fullName.isBlank()) errors.add("Thiếu họ và tên");
                checkLength(code, 30, "Mã sinh viên", errors);
                checkLength(fullName, 120, "Họ và tên", errors);
                checkLength(email, 255, "Email", errors);
                checkLength(phone, 20, "Số điện thoại", errors);
                if (!email.isBlank() && !email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$"))
                    errors.add("Email không đúng định dạng");

                LocalDate dob = parseDateOfBirth(row, formatter, errors);

                String gender = null;
                if (!genderText.isBlank()) {
                    gender = switch (genderText.trim().toUpperCase(Locale.ROOT)) {
                        case "MALE", "NAM" -> "MALE";
                        case "FEMALE", "NU", "NỮ" -> "FEMALE";
                        case "OTHER", "KHAC", "KHÁC" -> "OTHER";
                        default -> null;
                    };
                    if (gender == null) errors.add("Giới tính chỉ nhận Nam, Nữ hoặc Khác");
                }

                StudentStatus status = StudentStatus.STUDYING;
                if (!statusText.isBlank()) {
                    try { status = StudentStatus.valueOf(statusText.trim().toUpperCase(Locale.ROOT)); }
                    catch (IllegalArgumentException ex) { errors.add("Trạng thái không hợp lệ"); }
                }

                Classroom classroom = null;
                if (!classroomCode.isBlank()) {
                    classroom = classrooms.findByCodeIgnoreCase(classroomCode).orElse(null);
                    if (classroom == null) errors.add("Không tìm thấy lớp theo mã " + classroomCode);
                    else if (OCCUPYING.contains(status)) {
                        long already = students.countByClassroom_IdAndStatusIn(classroom.id, OCCUPYING);
                        long pending = additionsByClass.getOrDefault(classroom.id, 0L);
                        if (already + pending >= classroom.maxStudents) errors.add("Lớp đã đủ sĩ số tối đa");
                    }
                }

                if (errors.isEmpty() && classroom != null && OCCUPYING.contains(status))
                    additionsByClass.merge(classroom.id, 1L, Long::sum);
                result.add(new ImportRow(i + 1, code, fullName, dob, gender,
                        email.isBlank() ? null : email, phone.isBlank() ? null : phone,
                        status, classroom, errors));
            }
        } catch (IllegalArgumentException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new IllegalArgumentException("Không đọc được file Excel. Hãy kiểm tra định dạng và nội dung file.");
        }
        if (result.isEmpty()) throw new IllegalArgumentException("File không có dữ liệu sinh viên.");
        return result;
    }

    private Map<String, Object> report(List<ImportRow> rows) {
        List<Map<String, Object>> details = rows.stream().map(r -> {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("row", r.row());
            item.put("code", r.code());
            item.put("fullName", r.fullName());
            item.put("valid", r.valid());
            item.put("errors", r.errors());
            return item;
        }).toList();
        long valid = rows.stream().filter(ImportRow::valid).count();
        return Map.of("total", rows.size(), "valid", valid, "invalid", rows.size() - valid, "rows", details);
    }

    private List<ImportRow> checkedParse(MultipartFile file) throws IOException {
        try { return parse(file); }
        catch (IllegalArgumentException ex) {
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.BAD_REQUEST, ex.getMessage());
        }
    }

    @PostMapping(value = "/students/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Map<String, Object> preview(@RequestParam("file") MultipartFile file) throws IOException {
        return report(checkedParse(file));
    }

    @PostMapping(value = "/students/confirm", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Transactional
    public Map<String, Object> confirm(@RequestParam("file") MultipartFile file) throws IOException {
        List<ImportRow> rows = checkedParse(file);
        Map<String, Object> report = report(rows);
        if (((Number) report.get("invalid")).longValue() > 0)
            throw new org.springframework.web.server.ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "File còn dòng lỗi. Hãy sửa file và kiểm tra lại trước khi nhập.");
        List<Student> batch = new ArrayList<>();
        for (ImportRow row : rows) {
            Student student = new Student();
            student.code = row.code();
            student.fullName = row.fullName();
            student.dateOfBirth = row.dateOfBirth();
            student.gender = row.gender();
            student.email = row.email();
            student.phone = row.phone();
            student.status = row.status();
            student.classroom = row.classroom();
            batch.add(student);
        }
        students.saveAllAndFlush(batch);
        return Map.of("imported", batch.size(), "message", "Đã nhập dữ liệu sinh viên thành công.");
    }

    @GetMapping("/students/template")
    public ResponseEntity<byte[]> template() throws IOException {
        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("SinhVien");
            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.size(); i++) {
                header.createCell(i).setCellValue(HEADERS.get(i));
                sheet.setColumnWidth(i, i == 1 ? 8500 : 5200);
            }
            sheet.createFreezePane(0, 1);
            sheet.setAutoFilter(new org.apache.poi.ss.util.CellRangeAddress(0, 0, 0, HEADERS.size() - 1));

            Sheet guide = workbook.createSheet("HuongDan");
            String[][] instructions = {
                    {"CỘT", "HƯỚNG DẪN"},
                    {"code", "Bắt buộc. Mã sinh viên duy nhất, tối đa 30 ký tự."},
                    {"fullName", "Bắt buộc. Họ và tên, tối đa 120 ký tự."},
                    {"dateOfBirth", "Không bắt buộc. Dạng YYYY-MM-DD, DD/MM/YYYY hoặc ô ngày tháng Excel."},
                    {"gender", "Không bắt buộc. Nhập Nam, Nữ hoặc Khác."},
                    {"email", "Không bắt buộc. Email hợp lệ, tối đa 255 ký tự."},
                    {"phone", "Không bắt buộc. Tối đa 20 ký tự."},
                    {"status", "Không bắt buộc. STUDYING, SUSPENDED, RESERVED, GRADUATED, DROPPED_OUT hoặc EXPELLED. Mặc định STUDYING."},
                    {"classroomCode", "Không bắt buộc. Nhập mã lớp đã tồn tại; lớp tối đa 50 sinh viên đang học/tạm dừng/bảo lưu."},
                    {"LƯU Ý", "Nhập dữ liệu từ dòng 2 của sheet SinhVien. Không đổi tên hoặc thứ tự các cột."}
            };
            for (int r = 0; r < instructions.length; r++) {
                Row guideRow = guide.createRow(r);
                for (int c = 0; c < instructions[r].length; c++)
                    guideRow.createCell(c).setCellValue(instructions[r][c]);
            }
            guide.setColumnWidth(0, 6500);
            guide.setColumnWidth(1, 18000);
            workbook.write(out);
            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=student-import-template.xlsx")
                    .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                    .body(out.toByteArray());
        }
    }
}
