package vn.edu.qlsv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.Attendance;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    Optional<Attendance> findBySession_IdAndStudent_Id(Long sessionId, Long studentId);
    List<Attendance> findBySession_IdOrderByStudent_FullNameAsc(Long sessionId);
    List<Attendance> findByStudent_IdOrderBySession_SessionDateDesc(Long studentId);
}
