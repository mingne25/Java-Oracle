package vn.edu.qlsv.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.Authentication;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import vn.edu.qlsv.repository.UserAccountRepository;
import java.util.Map;
@RestController public class ProfileController {
 private final UserAccountRepository users;
 public ProfileController(UserAccountRepository users){this.users=users;}
 @GetMapping("/api/student/profile") public Object student(Authentication a){var u=users.findByUsername(a.getName()).orElseThrow();if(u.student==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND);return u.student;}
 @GetMapping("/api/teacher/profile") public Object teacher(Authentication a){var u=users.findByUsername(a.getName()).orElseThrow();if(u.teacher==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND);return u.teacher;}
}
