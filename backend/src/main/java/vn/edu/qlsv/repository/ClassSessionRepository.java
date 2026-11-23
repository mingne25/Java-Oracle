package vn.edu.qlsv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.ClassSession;
import java.time.LocalDate;
import java.util.List;

public interface ClassSessionRepository extends JpaRepository<ClassSession, Long> {
    List<ClassSession> findByClassroomSubject_Teacher_IdAndSessionDateBetweenOrderBySessionDateAscStartMinuteAsc(
            Long teacherId, LocalDate from, LocalDate to);

    List<ClassSession> findBySessionDateBetweenOrderBySessionDateAscStartMinuteAsc(
            LocalDate from, LocalDate to);

    List<ClassSession> findByClassroomSubject_Teacher_IdOrderBySessionDateAscStartMinuteAsc(Long teacherId);

    List<ClassSession> findByWeeklySchedule_IdOrderBySessionDateAscStartMinuteAsc(Long weeklyScheduleId);

    java.util.Optional<ClassSession> findByWeeklySchedule_IdAndSessionDate(Long weeklyScheduleId, LocalDate sessionDate);
}
