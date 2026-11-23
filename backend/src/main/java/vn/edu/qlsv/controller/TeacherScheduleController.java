package vn.edu.qlsv.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.qlsv.service.ScheduleAttendanceService;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/teacher")
public class TeacherScheduleController {

    private final ScheduleAttendanceService service;

    public TeacherScheduleController(ScheduleAttendanceService service) {
        this.service = service;
    }

    @GetMapping("/schedule/weekly")
    public List<ScheduleAttendanceService.ScheduleView> weekly(Authentication authentication) {
        return service.teacherWeeklySchedules(authentication.getName());
    }

    @GetMapping("/sessions")
    public List<ScheduleAttendanceService.SessionView> sessions(
            Authentication authentication,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.teacherSessions(authentication.getName(), from, to);
    }

    @GetMapping("/sessions/{sessionId}/students")
    public List<ScheduleAttendanceService.EnrolledStudentView> students(
            Authentication authentication, @PathVariable Long sessionId) {
        return service.sessionStudents(authentication.getName(), sessionId);
    }

    @PostMapping("/sessions/{sessionId}/attendance")
    public List<ScheduleAttendanceService.AttendanceView> markAttendance(
            Authentication authentication,
            @PathVariable Long sessionId,
            @RequestBody List<ScheduleAttendanceService.AttendanceInput> inputs) {
        return service.markAttendance(authentication.getName(), sessionId, inputs);
    }

    @GetMapping("/sessions/{sessionId}/attendance")
    public List<ScheduleAttendanceService.AttendanceView> attendance(
            Authentication authentication, @PathVariable Long sessionId) {
        return service.attendanceListForTeacher(authentication.getName(), sessionId);
    }
}
