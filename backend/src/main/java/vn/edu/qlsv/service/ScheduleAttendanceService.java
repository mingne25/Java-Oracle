package vn.edu.qlsv.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import vn.edu.qlsv.model.*;
import vn.edu.qlsv.repository.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional
public class ScheduleAttendanceService {

    private final WeeklyScheduleRepository weeklySchedules;
    private final ClassSessionRepository sessions;
    private final AttendanceRepository attendances;
    private final ClassroomSubjectRepository classroomSubjects;
    private final StudentRepository students;
    private final UserAccountRepository users;

    public ScheduleAttendanceService(
            WeeklyScheduleRepository weeklySchedules,
            ClassSessionRepository sessions,
            AttendanceRepository attendances,
            ClassroomSubjectRepository classroomSubjects,
            StudentRepository students,
            UserAccountRepository users) {
        this.weeklySchedules = weeklySchedules;
        this.sessions = sessions;
        this.attendances = attendances;
        this.classroomSubjects = classroomSubjects;
        this.students = students;
        this.users = users;
    }

    public record WeeklyScheduleInput(
            Long classroomSubjectId,
            Integer dayOfWeek,
            Integer startMinute,
            Integer endMinute,
            String room,
            LocalDate effectiveFrom,
            LocalDate effectiveTo) {
    }

    public record GenerateSessionsInput(LocalDate from, LocalDate to) { }

    public record GenerateSessionsResult(Long weeklyScheduleId, int createdCount, int skippedCount, List<SessionView> createdSessions) { }

    public record ClassSessionInput(
            Long classroomSubjectId,
            Long weeklyScheduleId,
            Integer sessionNo,
            LocalDate sessionDate,
            Integer startMinute,
            Integer endMinute,
            String room,
            String note) {
    }

    public record AttendanceInput(Long studentId, String status, String note) {
    }

    public record ScheduleView(
            Long id, Long classroomSubjectId, String classroomName, String subjectName,
            String teacherName, Integer dayOfWeek, Integer startMinute, Integer endMinute,
            String room, LocalDate effectiveFrom, LocalDate effectiveTo, Boolean active) {
    }

    public record SessionView(
            Long id, Long weeklyScheduleId, Long classroomSubjectId,
            String classroomName, String subjectName, String teacherName,
            Integer sessionNo, LocalDate sessionDate, Integer startMinute,
            Integer endMinute, String room, String status, String note) {
    }

    public record SessionStudentView(
            Long studentId, String studentCode,
            String studentName, String attendanceStatus, String attendanceNote) {
    }

    public record AttendanceView(
            Long id, Long sessionId, Long studentId,
            String studentCode, String studentName, String status,
            String note, java.time.LocalDateTime markedAt, Long markedByTeacherId) {
    }

    private ResponseStatusException badRequest(String message) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, message);
    }

    private ClassroomSubject offering(Long id) {
        if (id == null) throw badRequest("classroomSubjectId is required");
        return classroomSubjects.findById(id)
                .orElseThrow(() -> badRequest("Invalid classroomSubjectId"));
    }

    private Long teacherId(String username) {
        UserAccount user = users.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        if (user.teacher == null)
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Teacher account is not linked to a teacher");
        return user.teacher.id;
    }

    private void validateMinutes(Integer start, Integer end) {
        if (start == null || end == null || start < 0 || start > 1439
                || end < 1 || end > 1440 || end <= start)
            throw badRequest("Invalid startMinute/endMinute; use minutes from midnight and end must be later");
    }

    private ScheduleView scheduleView(WeeklySchedule x) {
        ClassroomSubject cs = x.classroomSubject;
        return new ScheduleView(x.id, cs.id, cs.classroom.name, cs.subject.name,
                cs.teacher.fullName, x.dayOfWeek, x.startMinute, x.endMinute,
                x.room, x.effectiveFrom, x.effectiveTo, x.active);
    }

    private SessionView sessionView(ClassSession x) {
        ClassroomSubject cs = x.classroomSubject;
        return new SessionView(x.id, x.weeklySchedule == null ? null : x.weeklySchedule.id,
                cs.id, cs.classroom.name, cs.subject.name, cs.teacher.fullName,
                x.sessionNo, x.sessionDate, x.startMinute, x.endMinute,
                x.room, x.status, x.note);
    }

    public ScheduleView createWeeklySchedule(WeeklyScheduleInput input) {
        if (input == null) throw badRequest("Request body is required");
        ClassroomSubject cs = offering(input.classroomSubjectId());
        if (input.dayOfWeek() == null || input.dayOfWeek() < 2 || input.dayOfWeek() > 8)
            throw badRequest("dayOfWeek must be from 2 (Monday) to 8 (Sunday)");
        validateMinutes(input.startMinute(), input.endMinute());
        if (input.effectiveFrom() == null) throw badRequest("effectiveFrom is required");
        if (input.effectiveTo() != null && input.effectiveTo().isBefore(input.effectiveFrom()))
            throw badRequest("effectiveTo cannot be before effectiveFrom");

        WeeklySchedule x = new WeeklySchedule();
        x.classroomSubject = cs;
        x.dayOfWeek = input.dayOfWeek();
        x.startMinute = input.startMinute();
        x.endMinute = input.endMinute();
        x.room = input.room();
        x.effectiveFrom = input.effectiveFrom();
        x.effectiveTo = input.effectiveTo();
        x.active = true;
        return scheduleView(weeklySchedules.save(x));
    }

    public ScheduleView updateWeeklySchedule(Long id, WeeklyScheduleInput input) {
        if (input == null) throw badRequest("Request body is required");
        WeeklySchedule x = weeklySchedules.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Weekly schedule not found"));
        ClassroomSubject cs = offering(input.classroomSubjectId());
        if (input.dayOfWeek() == null || input.dayOfWeek() < 2 || input.dayOfWeek() > 8)
            throw badRequest("dayOfWeek must be from 2 (Monday) to 8 (Sunday)");
        validateMinutes(input.startMinute(), input.endMinute());
        if (input.effectiveFrom() == null) throw badRequest("effectiveFrom is required");
        if (input.effectiveTo() != null && input.effectiveTo().isBefore(input.effectiveFrom()))
            throw badRequest("effectiveTo cannot be before effectiveFrom");
        x.classroomSubject = cs;
        x.dayOfWeek = input.dayOfWeek();
        x.startMinute = input.startMinute();
        x.endMinute = input.endMinute();
        x.room = input.room();
        x.effectiveFrom = input.effectiveFrom();
        x.effectiveTo = input.effectiveTo();
        return scheduleView(weeklySchedules.save(x));
    }

    public ScheduleView deactivateWeeklySchedule(Long id) {
        WeeklySchedule x = weeklySchedules.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Weekly schedule not found"));
        x.active = false;
        return scheduleView(weeklySchedules.save(x));
    }

    public GenerateSessionsResult generateSessions(Long id, GenerateSessionsInput input) {
        if (input == null || input.from() == null || input.to() == null) throw badRequest("from and to are required");
        if (input.to().isBefore(input.from()) || input.to().isAfter(input.from().plusMonths(6))) throw badRequest("Provide a valid generation range of at most six months");
        WeeklySchedule template = weeklySchedules.findById(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Weekly schedule not found"));
        if (!Boolean.TRUE.equals(template.active)) throw badRequest("Cannot generate sessions from an inactive weekly schedule");
        LocalDate first = input.from().isBefore(template.effectiveFrom) ? template.effectiveFrom : input.from();
        LocalDate last = template.effectiveTo != null && input.to().isAfter(template.effectiveTo) ? template.effectiveTo : input.to();
        if (last.isBefore(first)) return new GenerateSessionsResult(id, 0, 0, List.of());
        int nextSessionNo = sessions.findByWeeklySchedule_IdOrderBySessionDateAscStartMinuteAsc(id).size() + 1;
        int created = 0, skipped = 0;
        List<SessionView> createdSessions = new ArrayList<>();
        for (LocalDate date = first; !date.isAfter(last); date = date.plusDays(1)) {
            if (date.getDayOfWeek().getValue() + 1 != template.dayOfWeek) continue;
            if (sessions.findByWeeklySchedule_IdAndSessionDate(id, date).isPresent()) { skipped++; continue; }
            ClassSession session = new ClassSession();
            session.weeklySchedule = template; session.classroomSubject = template.classroomSubject;
            session.sessionNo = nextSessionNo++; session.sessionDate = date;
            session.startMinute = template.startMinute; session.endMinute = template.endMinute;
            session.room = template.room; session.status = "SCHEDULED"; session.note = null;
            createdSessions.add(sessionView(sessions.save(session))); created++;
        }
        return new GenerateSessionsResult(id, created, skipped, createdSessions);
    }

    public List<ScheduleView> listWeeklySchedules() {
        return weeklySchedules.findAll().stream().map(this::scheduleView).toList();
    }

    public List<ScheduleView> teacherWeeklySchedules(String username) {
        Long id = teacherId(username);
        return weeklySchedules.findByClassroomSubject_Teacher_IdOrderByDayOfWeekAscStartMinuteAsc(id)
                .stream().map(this::scheduleView).toList();
    }

    public SessionView createSession(ClassSessionInput input) {
        if (input == null) throw badRequest("Request body is required");
        ClassroomSubject cs = offering(input.classroomSubjectId());
        if (input.sessionDate() == null) throw badRequest("sessionDate is required");
        validateMinutes(input.startMinute(), input.endMinute());

        boolean hasAttendance = !attendances.findBySession_IdOrderByStudent_FullNameAsc(id).isEmpty();
        if (hasAttendance && !x.classroomSubject.id.equals(input.classroomSubjectId()))
            throw badRequest("Cannot change the class/subject of a session that already has attendance records");

        WeeklySchedule template = null;
        if (input.weeklyScheduleId() != null) {
            template = weeklySchedules.findById(input.weeklyScheduleId())
                    .orElseThrow(() -> badRequest("Invalid weeklyScheduleId"));
            if (!template.classroomSubject.id.equals(cs.id))
                throw badRequest("Weekly schedule does not belong to this classroom subject");
            if (!Boolean.TRUE.equals(template.active))
                throw badRequest("Cannot create a session from an inactive weekly schedule");
            if (input.sessionDate().getDayOfWeek().getValue() + 1 != template.dayOfWeek)
                throw badRequest("Session date does not match the weekly schedule day");
            if (input.sessionDate().isBefore(template.effectiveFrom)
                    || (template.effectiveTo != null && input.sessionDate().isAfter(template.effectiveTo)))
                throw badRequest("Session date is outside the weekly schedule effective period");
            if (sessions.findByWeeklySchedule_IdAndSessionDate(template.id, input.sessionDate()).isPresent())
                throw badRequest("A session already exists for this weekly schedule and date");
        }

        ClassSession x = new ClassSession();
        x.weeklySchedule = template;
        x.classroomSubject = cs;
        x.sessionNo = input.sessionNo();
        x.sessionDate = input.sessionDate();
        x.startMinute = input.startMinute();
        x.endMinute = input.endMinute();
        x.room = input.room();
        x.status = "SCHEDULED";
        x.note = input.note();
        return sessionView(sessions.save(x));
    }

    public SessionView updateSession(Long id, ClassSessionInput input) {
        if (input == null) throw badRequest("Request body is required");
        ClassSession x = sessions.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        if ("CANCELLED".equals(x.status))
            throw badRequest("A cancelled session cannot be updated");
        ClassroomSubject cs = offering(input.classroomSubjectId());
        if (input.sessionDate() == null) throw badRequest("sessionDate is required");
        validateMinutes(input.startMinute(), input.endMinute());

        WeeklySchedule template = null;
        if (input.weeklyScheduleId() != null) {
            template = weeklySchedules.findById(input.weeklyScheduleId())
                    .orElseThrow(() -> badRequest("Invalid weeklyScheduleId"));
            if (!template.classroomSubject.id.equals(cs.id))
                throw badRequest("Weekly schedule does not belong to this classroom subject");
            if (!Boolean.TRUE.equals(template.active)
                    && (x.weeklySchedule == null || !x.weeklySchedule.id.equals(template.id)))
                throw badRequest("Cannot use an inactive weekly schedule for a new session");
            if (input.sessionDate().getDayOfWeek().getValue() + 1 != template.dayOfWeek)
                throw badRequest("Session date does not match the weekly schedule day");
            if (input.sessionDate().isBefore(template.effectiveFrom)
                    || (template.effectiveTo != null && input.sessionDate().isAfter(template.effectiveTo)))
                throw badRequest("Session date is outside the weekly schedule effective period");
            var duplicate = sessions.findByWeeklySchedule_IdAndSessionDate(template.id, input.sessionDate());
            if (duplicate.isPresent() && !duplicate.get().id.equals(x.id))
                throw badRequest("A session already exists for this weekly schedule and date");
        }
        if (hasAttendance && ((x.weeklySchedule == null && template != null)
                || (x.weeklySchedule != null && (template == null || !x.weeklySchedule.id.equals(template.id)))))
            throw badRequest("Cannot change the source weekly schedule after attendance has been recorded");

        x.weeklySchedule = template;
        x.classroomSubject = cs;
        x.sessionNo = input.sessionNo();
        x.sessionDate = input.sessionDate();
        x.startMinute = input.startMinute();
        x.endMinute = input.endMinute();
        x.room = input.room();
        x.note = input.note();
        return sessionView(sessions.save(x));
    }

    public SessionView cancelSession(Long id) {
        ClassSession x = sessions.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        x.status = "CANCELLED";
        return sessionView(sessions.save(x));
    }

    public List<SessionView> adminSessions(LocalDate from, LocalDate to) {
        validateDateRange(from, to);
        return sessions.findBySessionDateBetweenOrderBySessionDateAscStartMinuteAsc(from, to)
                .stream().map(this::sessionView).toList();
    }

    public List<SessionView> teacherSessions(String username, LocalDate from, LocalDate to) {
        validateDateRange(from, to);
        Long id = teacherId(username);
        return sessions.findByClassroomSubject_Teacher_IdAndSessionDateBetweenOrderBySessionDateAscStartMinuteAsc(
                id, from, to).stream().map(this::sessionView).toList();
    }

    private void validateDateRange(LocalDate from, LocalDate to) {
        if (from == null || to == null || to.isBefore(from) || to.isAfter(from.plusMonths(6)))
            throw badRequest("Provide a valid date range of at most six months");
    }

    private ClassSession teacherSession(Long sessionId, Long teacher) {
        ClassSession session = sessions.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found"));
        if (!session.classroomSubject.teacher.id.equals(teacher))
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Session not found");
        return session;
    }

    public List<SessionStudentView> sessionStudents(String username, Long sessionId) {
        Long teacher = teacherId(username);
        ClassSession session = teacherSession(sessionId, teacher);
        Long classroomId = session.classroomSubject.classroom.id;
        return students.findByClassroom_IdOrderByFullNameAsc(classroomId).stream().map(student -> {
            var attendance = attendances.findBySession_IdAndStudent_Id(
                    session.id, student.id).orElse(null);
            return new SessionStudentView(student.id, student.code, student.fullName,
                    attendance == null ? null : attendance.status,
                    attendance == null ? null : attendance.note);
        }).toList();
    }

    public List<AttendanceView> markAttendance(
            String username, Long sessionId, List<AttendanceInput> inputs) {
        Long teacher = teacherId(username);
        ClassSession session = teacherSession(sessionId, teacher);
        if ("CANCELLED".equals(session.status))
            throw badRequest("Cannot mark attendance for a cancelled session");
        if (inputs == null || inputs.isEmpty())
            throw badRequest("Attendance list cannot be empty");

        for (AttendanceInput input : inputs) {
            if (input == null || input.studentId() == null)
                throw badRequest("studentId is required");
            String status = input.status() == null ? "" : input.status().trim().toUpperCase();
            if (!List.of("PRESENT", "ABSENT", "LATE").contains(status))
                throw badRequest("status must be PRESENT, ABSENT or LATE");

            Student student = students.findById(input.studentId())
                    .orElseThrow(() -> badRequest("Invalid studentId"));
            Long classroomId = session.classroomSubject.classroom.id;
            if (student.classroom == null || !student.classroom.id.equals(classroomId))
                throw badRequest("Student does not belong to the classroom assigned to this subject");

            Attendance attendance = attendances
                    .findBySession_IdAndStudent_Id(session.id, student.id)
                    .orElseGet(Attendance::new);
            attendance.session = session;
            attendance.classroomSubject = session.classroomSubject;
            attendance.student = student;
            attendance.classroom = session.classroomSubject.classroom;
            attendance.markedByTeacher = session.classroomSubject.teacher;
            attendance.status = status;
            attendance.note = input.note();
            attendances.save(attendance);
        }
        return attendanceList(session.id);
    }

    public List<AttendanceView> attendanceListForTeacher(String username, Long sessionId) {
        Long teacher = teacherId(username);
        teacherSession(sessionId, teacher);
        return attendanceList(sessionId);
    }

    private List<AttendanceView> attendanceList(Long sessionId) {
        return attendances.findBySession_IdOrderByStudent_FullNameAsc(sessionId)
                .stream().map(a -> new AttendanceView(a.id, a.session.id,
                        a.student.id, a.student.code, a.student.fullName,
                        a.status, a.note, a.markedAt, a.markedByTeacher.id)).toList();
    }
}
