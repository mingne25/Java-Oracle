package vn.edu.qlsv.repository;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.UserAccount;
public interface UserAccountRepository extends JpaRepository<UserAccount,Long> { Optional<UserAccount> findByUsername(String username); }
