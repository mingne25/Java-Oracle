package vn.edu.qlsv.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.Teacher;
import java.util.List;
public interface TeacherRepository extends JpaRepository<Teacher,Long> {
 List<Teacher> findByFaculty_Id(Long facultyId);
}
