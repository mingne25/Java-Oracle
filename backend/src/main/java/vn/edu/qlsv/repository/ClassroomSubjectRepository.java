package vn.edu.qlsv.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.ClassroomSubject;
import java.util.Optional;

public interface ClassroomSubjectRepository extends JpaRepository<ClassroomSubject, Long> {
    Optional<ClassroomSubject> findByClassroom_IdAndSubject_Id(Long classroomId, Long subjectId);
    boolean existsByClassroom_Id(Long classroomId);
    boolean existsBySubject_Id(Long subjectId);
    boolean existsByTeacher_Id(Long teacherId);
}
