package vn.edu.qlsv.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.Student;
public interface StudentRepository extends JpaRepository<Student,Long> { }
