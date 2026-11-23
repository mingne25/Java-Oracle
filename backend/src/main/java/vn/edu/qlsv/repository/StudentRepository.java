package vn.edu.qlsv.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.Student;
import vn.edu.qlsv.model.StudentStatus;
import java.util.Collection;
import java.util.List;
public interface StudentRepository extends JpaRepository<Student,Long> {
 boolean existsByCodeIgnoreCase(String code);
 List<Student> findByClassroom_Faculty_Id(Long facultyId);
 List<Student> findByClassroom_Teacher_Id(Long teacherId);
 List<Student> findByClassroom_Id(Long classroomId);
 boolean existsByClassroom_Id(Long classroomId);
 long countByClassroom_IdAndStatusIn(Long classroomId,Collection<StudentStatus> statuses);
 long countByClassroom_IdAndStatusInAndIdNot(Long classroomId,Collection<StudentStatus> statuses,Long excludedStudentId);
}