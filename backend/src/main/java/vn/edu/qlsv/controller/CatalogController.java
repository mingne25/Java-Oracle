package vn.edu.qlsv.controller;

import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.core.Authentication;
import vn.edu.qlsv.model.*;
import vn.edu.qlsv.repository.*;
import java.util.*;

@RestController
@RequestMapping("/api/catalog")
public class CatalogController {
    private final CourseYearRepository years;
    private final FacultyRepository faculties;
    private final ClassroomRepository classes;
    private final SubjectRepository subjects;
    private final TeacherRepository teachers;
    private final StudentRepository students;
    private final UserAccountRepository users;
    private final ClassroomSubjectRepository classroomSubjects;
    private final StudentSubjectRepository studentSubjects;

    public CatalogController(CourseYearRepository y, FacultyRepository f, ClassroomRepository c, SubjectRepository s,
            TeacherRepository t, StudentRepository st, UserAccountRepository u,
            ClassroomSubjectRepository cs, StudentSubjectRepository ss) {
        years = y;
        faculties = f;
        classes = c;
        subjects = s;
        teachers = t;
        students = st;
        users = u;
        classroomSubjects = cs;
        studentSubjects = ss;
    }

    private JpaRepository<?, Long> repository(String type) {
        return switch (type) {
            case "years" -> years;
            case "faculties" -> faculties;
            case "classes" -> classes;
            case "subjects" -> subjects;
            case "teachers" -> teachers;
            case "students" -> students;
            case "class-subjects" -> classroomSubjects;
            case "student-subjects" -> studentSubjects;
            default -> throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        };
    }

    record StudentSummary(Long id, String code, String fullName, String classroomName, StudentStatus status) {
    }

    record FacultySummary(Long id, String name) {
    }

    record TeacherSummary(Long id, String code, String fullName) {
    }

    record ClassroomSummary(Long id, String code, String name, FacultySummary faculty, TeacherSummary teacher,
            Integer maxStudents) {
    }

    record SubjectSummary(Long id, String code, String name, FacultySummary faculty) {
    }

    record ClassroomSubjectSummary(Long id, Long classroomId, ClassroomSummary classroom,
            Long subjectId, SubjectSummary subject, Long teacherId, TeacherSummary teacher,
            String code, String name) {
    }

    record StudentSubjectSummary(Long id, Long studentId, StudentSummary student,
            Long classSubjectId, ClassroomSubjectSummary classSubject,
            String code, String name, String classroomName, String teacherName) {
    }

    private boolean isAdmin(Authentication auth) {
        return hasRole(auth, "ROLE_ADMIN");
    }

    private boolean isTeacher(Authentication auth) {
        return hasRole(auth, "ROLE_TEACHER");
    }

    private boolean hasRole(Authentication auth, String role) {
        return auth.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals(role));
    }

    private Long teacherFaculty(Authentication auth) {
        var user = users.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (user.teacher == null || user.teacher.faculty == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return user.teacher.faculty.id;
    }

    private Long teacherId(Authentication auth) {
        var user = users.findByUsername(auth.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        if (user.teacher == null)
            throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        return user.teacher.id;
    }

    private StudentSummary summary(Student s) {
        return new StudentSummary(s.id, s.code, s.fullName, s.classroom == null ? null : s.classroom.name, s.status);
    }

    private ClassroomSummary classSummary(Classroom classroom) {
        FacultySummary faculty = classroom.faculty == null
                ? null
                : new FacultySummary(classroom.faculty.id, classroom.faculty.name);
        TeacherSummary teacher = classroom.teacher == null
                ? null
                : new TeacherSummary(classroom.teacher.id, classroom.teacher.code, classroom.teacher.fullName);
        return new ClassroomSummary(classroom.id, classroom.code, classroom.name, faculty, teacher,
                classroom.maxStudents);
    }

    private SubjectSummary subjectSummary(Subject subject) {
        FacultySummary faculty = subject.faculty == null
                ? null
                : new FacultySummary(subject.faculty.id, subject.faculty.name);
        return new SubjectSummary(subject.id, subject.code, subject.name, faculty);
    }

    private ClassroomSubjectSummary classroomSubjectSummary(ClassroomSubject offering) {
        ClassroomSummary classroom = classSummary(offering.classroom);
        SubjectSummary subject = subjectSummary(offering.subject);
        TeacherSummary teacher = offering.teacher == null
                ? null
                : new TeacherSummary(offering.teacher.id, offering.teacher.code, offering.teacher.fullName);
        return new ClassroomSubjectSummary(offering.id, offering.classroom.id, classroom,
                offering.subject.id, subject, offering.teacher.id, teacher,
                offering.classroom.code + " / " + offering.subject.code,
                offering.classroom.name + " · " + offering.subject.name);
    }

    private StudentSubjectSummary studentSubjectSummary(StudentSubject enrollment) {
        StudentSummary student = summary(enrollment.student);
        ClassroomSubjectSummary offering = classroomSubjectSummary(enrollment.classroomSubject);
        return new StudentSubjectSummary(enrollment.id, enrollment.student.id, student,
                enrollment.classroomSubject.id, offering,
                enrollment.student.code,
                enrollment.student.fullName + " · " + enrollment.classroomSubject.subject.name,
                enrollment.classroomSubject.classroom.name,
                enrollment.classroomSubject.teacher.fullName);
    }

    @GetMapping("/{type}")
    public Object list(@PathVariable String type, Authentication auth) {
        if (type.equals("class-subjects"))
            return classroomSubjects.findAll().stream().map(this::classroomSubjectSummary).toList();
        if (type.equals("student-subjects"))
            return studentSubjects.findAll().stream().map(this::studentSubjectSummary).toList();
        if (type.equals("classes")) {
            List<Classroom> visibleClasses = isTeacher(auth)
                    ? classes.findByTeacher_Id(teacherId(auth))
                    : classes.findAll();
            return visibleClasses.stream().map(this::classSummary).toList();
        }
        if (type.equals("students") && isTeacher(auth)) {
            Long teacherId = teacherId(auth);
            return students.findByClassroom_Teacher_Id(teacherId).stream().map(this::summary).toList();
        }
        if (type.equals("teachers") && isTeacher(auth))
            return teachers.findByFaculty_Id(teacherFaculty(auth));
        return repository(type).findAll();
    }

    @GetMapping("/{type}/{id}")
    public Object one(@PathVariable String type, @PathVariable Long id, Authentication auth) {
        if (type.equals("class-subjects"))
            return classroomSubjectSummary(classroomSubjects.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)));
        if (type.equals("student-subjects"))
            return studentSubjectSummary(studentSubjects.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND)));
        if (type.equals("classes") && isTeacher(auth)) {
            Long teacherId = teacherId(auth);
            Classroom classroom = classes.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            if (classroom.teacher == null || !classroom.teacher.id.equals(teacherId))
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            return classSummary(classroom);
        }
        if (type.equals("students") && isTeacher(auth)) {
            Long teacherId = teacherId(auth);
            Student s = students.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            if (s.classroom == null || s.classroom.teacher == null || !s.classroom.teacher.id.equals(teacherId))
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            return summary(s);
        }
        if (type.equals("teachers") && isTeacher(auth)) {
            Long facultyId = teacherFaculty(auth);
            Teacher t = teachers.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
            if (t.faculty == null || !t.faculty.id.equals(facultyId))
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
            return t;
        }
        return repository(type).findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/{type}")
    @Transactional
    public Object create(@PathVariable String type, @RequestBody Map<String, Object> data) {
        return save(type, null, data);
    }

    @PutMapping("/{type}/{id}")
    @Transactional
    public Object update(@PathVariable String type, @PathVariable Long id, @RequestBody Map<String, Object> data) {
        return save(type, id, data);
    }

    private ResponseStatusException badInput(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private String str(Map<String, Object> d, String k) {
        Object v = d.get(k);
        return v == null ? null : v.toString().trim();
    }

    private Long number(Map<String, Object> d, String k) {
        String v = str(d, k);
        if (v == null || v.isBlank())
            return null;
        try {
            return Long.valueOf(v);
        } catch (NumberFormatException e) {
            throw badInput(k + " must be a whole number");
        }
    }

    private Long requiredNumber(Map<String, Object> d, String k) {
        Long v = number(d, k);
        if (v == null)
            throw badInput(k + " is required");
        return v;
    }

    private Integer integer(Map<String, Object> d, String k) {
        String v = str(d, k);
        if (v == null || v.isBlank())
            throw badInput(k + " is required");
        try {
            return Integer.valueOf(v);
        } catch (NumberFormatException e) {
            throw badInput(k + " must be a whole number");
        }
    }

    private <T> T required(Optional<T> value) {
        return value.orElseThrow(() -> badInput("Invalid reference"));
    }

    private void nonblank(String s, String key) {
        if (s == null || s.isBlank())
            throw badInput(key + " is required");
    }

    private java.time.LocalDate date(String value) {
        try {
            return java.time.LocalDate.parse(value);
        } catch (java.time.format.DateTimeParseException e) {
            throw badInput("dateOfBirth must use YYYY-MM-DD");
        }
    }

    private StudentStatus status(String value) {
        try {
            return StudentStatus.valueOf(value);
        } catch (IllegalArgumentException e) {
            throw badInput("Invalid student status");
        }
    }

    private String gender(String value) {
        if (value == null || value.isBlank())
            return null;
        return switch (value.trim().toUpperCase(Locale.ROOT)) {
            case "MALE", "NAM" -> "MALE";
            case "FEMALE", "NỮ", "NU" -> "FEMALE";
            case "OTHER", "KHÁC", "KHAC" -> "OTHER";
            default -> throw badInput("Invalid gender");
        };
    }

    private boolean isOccupying(StudentStatus status) {
        return status == StudentStatus.STUDYING || status == StudentStatus.SUSPENDED
                || status == StudentStatus.RESERVED;
    }

    private void capacity(Classroom c, Long exclude) {
        List<StudentStatus> occupying = List.of(StudentStatus.STUDYING, StudentStatus.SUSPENDED,
                StudentStatus.RESERVED);
        long count = exclude == null ? students.countByClassroom_IdAndStatusIn(c.id, occupying)
                : students.countByClassroom_IdAndStatusInAndIdNot(c.id, occupying, exclude);
        if (count >= c.maxStudents)
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lớp đã đủ " + c.maxStudents + " sinh viên, yêu cầu chọn lớp khác.");
    }

    private Object save(String type, Long id, Map<String, Object> d) {
        switch (type) {
            case "years": {
                CourseYear x = id == null ? new CourseYear() : required(years.findById(id));
                x.code = str(d, "code");
                x.name = str(d, "name");
                nonblank(x.code, "code");
                nonblank(x.name, "name");
                x.startYear = integer(d, "startYear");
                return years.save(x);
            }
            case "faculties": {
                Faculty x = id == null ? new Faculty() : required(faculties.findById(id));
                x.code = str(d, "code");
                x.name = str(d, "name");
                nonblank(x.code, "code");
                nonblank(x.name, "name");
                x.courseYear = required(years.findById(requiredNumber(d, "courseYearId")));
                return faculties.save(x);
            }
            case "classes": {
                Classroom x = id == null ? new Classroom() : required(classes.findById(id));
                x.code = str(d, "code");
                x.name = str(d, "name");
                nonblank(x.code, "code");
                nonblank(x.name, "name");
                Faculty faculty = required(faculties.findById(requiredNumber(d, "facultyId")));
                if (id != null && x.faculty != null && !x.faculty.id.equals(faculty.id)
                        && (students.existsByClassroom_Id(x.id) || classroomSubjects.existsByClassroom_Id(x.id)))
                    throw badInput("Move students and remove class subject offerings before changing the classroom faculty");
                Teacher teacher = required(teachers.findById(requiredNumber(d, "teacherId")));
                if (teacher.faculty == null || !teacher.faculty.id.equals(faculty.id))
                    throw badInput("Teacher must belong to the classroom faculty");
                x.faculty = faculty;
                x.teacher = teacher;
                x.maxStudents = 50;
                return classSummary(classes.saveAndFlush(x));
            }
            case "subjects": {
                Subject x = id == null ? new Subject() : required(subjects.findById(id));
                x.code = str(d, "code");
                x.name = str(d, "name");
                nonblank(x.code, "code");
                nonblank(x.name, "name");
                Faculty faculty = required(faculties.findById(requiredNumber(d, "facultyId")));
                if (id != null && x.faculty != null && !x.faculty.id.equals(faculty.id)
                        && classroomSubjects.existsBySubject_Id(x.id))
                    throw badInput("Remove this subject from classrooms before changing its faculty");
                x.faculty = faculty;
                return subjects.save(x);
            }
            case "teachers": {
                Teacher x = id == null ? new Teacher() : required(teachers.findById(id));
                x.code = str(d, "code");
                x.fullName = str(d, "fullName");
                x.email = str(d, "email");
                nonblank(x.code, "code");
                nonblank(x.fullName, "fullName");
                Faculty faculty = required(faculties.findById(requiredNumber(d, "facultyId")));
                if (id != null && x.faculty != null && !x.faculty.id.equals(faculty.id)
                        && (classroomSubjects.existsByTeacher_Id(x.id) || !classes.findByTeacher_Id(x.id).isEmpty()))
                    throw badInput("Unassign this teacher from classes and subjects before changing their faculty");
                x.faculty = faculty;
                return teachers.save(x);
            }
            case "class-subjects": {
                ClassroomSubject x = id == null ? new ClassroomSubject()
                        : required(classroomSubjects.findById(id));
                Classroom classroom = required(classes.findById(requiredNumber(d, "classroomId")));
                Subject subject = required(subjects.findById(requiredNumber(d, "subjectId")));
                Teacher teacher = required(teachers.findById(requiredNumber(d, "teacherId")));
                if (id != null && (!x.classroom.id.equals(classroom.id) || !x.subject.id.equals(subject.id))
                        && studentSubjects.existsByClassroomSubject_Id(x.id))
                    throw badInput("Remove student registrations before changing the classroom or subject for this offering");
                if (!classroom.faculty.id.equals(subject.faculty.id))
                    throw badInput("Subject must belong to the classroom faculty");
                if (teacher.faculty == null || !teacher.faculty.id.equals(classroom.faculty.id))
                    throw badInput("Teacher must belong to the classroom faculty");
                Optional<ClassroomSubject> duplicate = classroomSubjects
                        .findByClassroom_IdAndSubject_Id(classroom.id, subject.id);
                if (duplicate.isPresent() && !duplicate.get().id.equals(x.id))
                    throw badInput("This subject is already assigned to the classroom");
                x.classroom = classroom;
                x.subject = subject;
                x.teacher = teacher;
                return classroomSubjectSummary(classroomSubjects.saveAndFlush(x));
            }
            case "student-subjects": {
                StudentSubject x = id == null ? new StudentSubject()
                        : required(studentSubjects.findById(id));
                Student student = required(students.findById(requiredNumber(d, "studentId")));
                ClassroomSubject offering = required(classroomSubjects
                        .findById(requiredNumber(d, "classSubjectId")));
                if (student.classroom == null || !student.classroom.id.equals(offering.classroom.id))
                    throw badInput("Student must belong to the classroom offering this subject");
                Optional<StudentSubject> duplicate = studentSubjects
                        .findByStudent_IdAndClassroomSubject_Id(student.id, offering.id);
                if (duplicate.isPresent() && !duplicate.get().id.equals(x.id))
                    throw badInput("Student is already enrolled in this subject");
                x.student = student;
                x.classroomSubject = offering;
                x.classroomId = offering.classroom.id;
                return studentSubjectSummary(studentSubjects.saveAndFlush(x));
            }
            case "students": {
                Student x = id == null ? new Student() : required(students.findById(id));
                StudentStatus previousStatus = x.status;
                String code = str(d, "code");
                String fullName = str(d, "fullName");
                String email = str(d, "email");
                String phone = str(d, "phone");
                String genderVal = str(d, "gender");

                nonblank(code, "Mã sinh viên");
                nonblank(fullName, "Họ và tên sinh viên");

                if (email != null && !email.isBlank()) {
                    if (!email.matches("^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
                        throw badInput("Email không đúng định dạng. Vui lòng kiểm tra lại.");
                    }
                }

                if (id == null) {
                    if (students.existsByCode(code)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Sinh viên đã tồn tại (Mã sinh viên " + code + " đã có trong hệ thống). Yêu cầu nhập lại.");
                    }
                    if (email != null && !email.isBlank() && students.existsByEmail(email)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Sinh viên đã tồn tại (Email " + email + " đã có trong hệ thống). Yêu cầu nhập lại.");
                    }
                } else {
                    if (students.existsByCodeAndIdNot(code, id)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Dữ liệu bị trùng lặp: Mã sinh viên " + code + " đã thuộc về sinh viên khác. Yêu cầu kiểm tra, nhập lại.");
                    }
                    if (email != null && !email.isBlank() && students.existsByEmailAndIdNot(email, id)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT, "Dữ liệu bị trùng lặp: Email " + email + " đã thuộc về sinh viên khác. Yêu cầu kiểm tra, nhập lại.");
                    }
                }

                x.code = code;
                x.fullName = fullName;
                x.email = email;
                x.phone = phone;
                x.gender = gender(genderVal);

                String dob = str(d, "dateOfBirth");
                if (dob != null && !dob.isBlank())
                    x.dateOfBirth = date(dob);
                String state = str(d, "status");
                x.status = state == null ? StudentStatus.STUDYING : status(state);
                Long cid = number(d, "classroomId");
                if (cid != null) {
                    Classroom c = required(classes.findByIdForUpdate(cid));
                    boolean moving = x.classroom == null || !x.classroom.id.equals(cid);
                    boolean reactivating = isOccupying(x.status)
                            && (previousStatus == null || !isOccupying(previousStatus));
                    if (isOccupying(x.status) && (moving || reactivating))
                        capacity(c, id);
                    if (moving && id != null && studentSubjects.existsByStudent_Id(id))
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Cần hủy các môn học đã đăng ký của lớp cũ trước khi chuyển lớp.");
                    if (x.classroom != null && !x.classroom.faculty.id.equals(c.faculty.id))
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Không thể chuyển sinh viên sang lớp thuộc khoa khác.");
                    x.classroom = c;
                } else {
                    if (id != null && x.classroom != null && studentSubjects.existsByStudent_Id(id)) {
                        throw new ResponseStatusException(HttpStatus.CONFLICT,
                                "Cần hủy các môn học đã đăng ký của sinh viên trước khi rút sinh viên khỏi lớp.");
                    }
                    x.classroom = null;
                }
                return students.save(x);
            }
            default:
                throw new ResponseStatusException(HttpStatus.NOT_FOUND);
        }
    }

    private String deleteConflictMessage(String type) {
        return switch (type) {
            case "years" -> "Không thể xóa khóa học vì đang có khoa liên kết. Hãy chuyển hoặc xóa các khoa liên quan trước.";
            case "faculties" -> "Không thể xóa khoa vì đang có lớp, môn học hoặc giảng viên thuộc khoa. Hãy chuyển hoặc xóa dữ liệu liên quan trước.";
            case "classes" -> "Không thể xóa lớp vì đang có sinh viên hoặc môn học được mở cho lớp. Hãy gỡ các liên kết trước.";
            case "subjects" -> "Không thể xóa môn học vì đang được mở cho một hoặc nhiều lớp. Hãy xóa các lớp–môn liên quan trước.";
            case "class-subjects" -> "Không thể xóa môn học của lớp vì sinh viên đã đăng ký. Hãy xóa các đăng ký sinh viên trước.";
            case "student-subjects" -> "Không thể xóa đăng ký môn học.";
            case "teachers" -> "Không thể xóa giảng viên vì đang phụ trách lớp, dạy môn trong lớp hoặc có tài khoản liên kết. Hãy gỡ các liên kết này trước.";
            case "students" -> "Không thể xóa sinh viên vì đang có tài khoản hoặc đăng ký môn học liên kết. Hãy gỡ các liên kết trước.";
            default -> "Không thể xóa bản ghi vì dữ liệu khác đang tham chiếu đến bản ghi này. Hãy gỡ các liên kết trước.";
        };
    }

    @PostMapping("/students/{id}/assign-class")
    @Transactional
    public StudentSummary assignClass(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Student student = required(students.findById(id));
        if (student.classroom != null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sinh viên đã được phân lớp, không thể thực hiện.");
        }
        Long cid = requiredNumber(body, "classroomId");
        Classroom c = required(classes.findByIdForUpdate(cid));
        capacity(c, id);
        student.classroom = c;
        return summary(students.saveAndFlush(student));
    }

    @PostMapping("/students/{id}/transfer-class")
    @Transactional
    public StudentSummary transferClass(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Student student = required(students.findById(id));
        if (student.classroom == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sinh viên chưa được phân lớp. Hãy sử dụng chức năng phân lớp.");
        }
        Long cid = requiredNumber(body, "classroomId");
        if (student.classroom.id.equals(cid)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Lớp đích trùng với lớp hiện tại của sinh viên.");
        }
        Classroom target = required(classes.findByIdForUpdate(cid));
        if (!student.classroom.faculty.id.equals(target.faculty.id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Không được phép chuyển sinh viên sang lớp thuộc khoa khác.");
        }
        capacity(target, id);
        if (studentSubjects.existsByStudent_Id(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cần hủy các môn học đã đăng ký của lớp cũ trước khi chuyển lớp.");
        }
        student.classroom = target;
        return summary(students.saveAndFlush(student));
    }

    @DeleteMapping("/{type}/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@PathVariable String type, @PathVariable Long id) {
        if (type.equals("students")) {
            Student s = students.findById(id)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Sinh viên không tồn tại trong hệ thống. Vui lòng chọn lại."));
            if (s.classroom != null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Sinh viên đang tham gia lớp học, không đủ điều kiện xóa. Yêu cầu kiểm tra lại.");
            }
            if (users.existsByStudent_Id(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa sinh viên vì đang có tài khoản liên kết. Vui lòng xóa tài khoản trước.");
            }
            if (studentSubjects.existsByStudent_Id(id)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Không thể xóa sinh viên vì đang có đăng ký môn học liên kết. Vui lòng hủy đăng ký trước.");
            }
            students.delete(s);
            students.flush();
            return;
        }

        JpaRepository<?, Long> repo = repository(type);
        if (!repo.existsById(id))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy bản ghi cần xóa.");

        try {
            repo.deleteById(id);
            repo.flush();
        } catch (DataIntegrityViolationException e) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, deleteConflictMessage(type), e);
        }
    }
}