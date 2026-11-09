package vn.edu.qlsv.repository;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import vn.edu.qlsv.model.Classroom;
import java.util.Optional;
public interface ClassroomRepository extends JpaRepository<Classroom,Long> {
 @Lock(LockModeType.PESSIMISTIC_WRITE)
 @Query("select c from Classroom c where c.id = :id")
 Optional<Classroom> findByIdForUpdate(@Param("id") Long id);
}