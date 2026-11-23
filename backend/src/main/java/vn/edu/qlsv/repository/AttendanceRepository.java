package vn.edu.qlsv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.Attendance;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findBySession_IdAndStudentSubject_Id(Long sessionId, Long studentSubjectId);
    List<Attendance> findBySession_IdOrderByStudentSubject_Student_FullNameAsc(Long sessionId);
    List<Attendance> findByStudentSubject_Student_IdOrderBySession_SessionDateDesc(Long studentId);
}
