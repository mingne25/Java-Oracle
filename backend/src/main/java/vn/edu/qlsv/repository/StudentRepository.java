package vn.edu.qlsv.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.Student;
import vn.edu.qlsv.model.StudentStatus;
import java.util.Collection;
import java.util.List;
public interface StudentRepository extends JpaRepository<Student,Long> {
 List<Student> findByClassroom_Faculty_Id(Long facultyId);
 long countByClassroom_IdAndStatusIn(Long classroomId,Collection<StudentStatus> statuses);
 long countByClassroom_IdAndStatusInAndIdNot(Long classroomId,Collection<StudentStatus> statuses,Long excludedStudentId);
}