package vn.edu.qlsv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.StudentSubject;
import java.util.Optional;

public interface StudentSubjectRepository extends JpaRepository<StudentSubject, Long> {
    Optional<StudentSubject> findByStudent_IdAndClassroomSubject_Id(Long studentId, Long classroomSubjectId);
    boolean existsByStudent_Id(Long studentId);
    boolean existsByClassroomSubject_Id(Long classroomSubjectId);
}
