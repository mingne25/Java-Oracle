package vn.edu.qlsv.controller;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import vn.edu.qlsv.service.ScheduleAttendanceService;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/schedules")
public class AdminScheduleController {

    private final ScheduleAttendanceService service;

    public AdminScheduleController(ScheduleAttendanceService service) {
        this.service = service;
    }

    @PostMapping("/weekly")
    public ScheduleAttendanceService.ScheduleView createWeekly(
            @RequestBody ScheduleAttendanceService.WeeklyScheduleInput input) {
        return service.createWeeklySchedule(input);
    }

    @PutMapping("/weekly/{id}")
    public ScheduleAttendanceService.ScheduleView updateWeekly(
            @PathVariable Long id,
            @RequestBody ScheduleAttendanceService.WeeklyScheduleInput input) {
        return service.updateWeeklySchedule(id, input);
    }

    @GetMapping("/weekly")
    public List<ScheduleAttendanceService.ScheduleView> listWeekly() {
        return service.listWeeklySchedules();
    }

    @PostMapping("/sessions")
    public ScheduleAttendanceService.SessionView createSession(
            @RequestBody ScheduleAttendanceService.ClassSessionInput input) {
        return service.createSession(input);
    }

    @PutMapping("/sessions/{id}")
    public ScheduleAttendanceService.SessionView updateSession(
            @PathVariable Long id,
            @RequestBody ScheduleAttendanceService.ClassSessionInput input) {
        return service.updateSession(id, input);
    }

    @PutMapping("/sessions/{id}/cancel")
    public ScheduleAttendanceService.SessionView cancelSession(@PathVariable Long id) {
        return service.cancelSession(id);
    }

    @GetMapping("/sessions")
    public List<ScheduleAttendanceService.SessionView> listSessions(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return service.adminSessions(from, to);
    }
}
