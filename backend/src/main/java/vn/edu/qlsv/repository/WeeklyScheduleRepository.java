package vn.edu.qlsv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.WeeklySchedule;
import java.util.List;

public interface WeeklyScheduleRepository extends JpaRepository<WeeklySchedule, Long> {
    List<WeeklySchedule> findByClassroomSubject_IdOrderByDayOfWeekAscStartMinuteAsc(Long classroomSubjectId);
    List<WeeklySchedule> findByClassroomSubject_Teacher_IdOrderByDayOfWeekAscStartMinuteAsc(Long teacherId);
}
