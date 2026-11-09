package vn.edu.qlsv.config;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.edu.qlsv.model.*;
import vn.edu.qlsv.model.Role;
import vn.edu.qlsv.repository.UserAccountRepository;
@Configuration public class AdminSeed {
 @Bean CommandLineRunner seed(UserAccountRepository repo,PasswordEncoder encoder,@Value("${app.admin.username}") String username,@Value("${app.admin.password}") String password){return args->{if(password==null||password.isBlank())throw new IllegalStateException("ADMIN_PASSWORD is required");if(repo.findByUsername(username).isEmpty()){var u=new UserAccount();u.username=username;u.passwordHash=encoder.encode(password);u.role=Role.ADMIN;u.enabled=true;repo.save(u);}};}
}
