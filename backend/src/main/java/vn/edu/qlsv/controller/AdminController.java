package vn.edu.qlsv.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.security.crypto.password.PasswordEncoder;
import vn.edu.qlsv.model.*;
import vn.edu.qlsv.repository.*;
import java.util.*;
@RestController @RequestMapping("/api/admin") public class AdminController {
 private final UserAccountRepository users;private final StudentRepository students;private final TeacherRepository teachers;private final PasswordEncoder encoder;private final ClassroomRepository classes;private final FacultyRepository faculties;private final CourseYearRepository years;
 public AdminController(UserAccountRepository u,StudentRepository s,TeacherRepository t,PasswordEncoder e,ClassroomRepository c,FacultyRepository f,CourseYearRepository y){users=u;students=s;teachers=t;encoder=e;classes=c;faculties=f;years=y;}
 record NewUser(String username,String password,Role role,Long studentId,Long teacherId){}
 private ResponseStatusException badInput(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 @PostMapping("/users") public Map<String,Object> create(@RequestBody NewUser d){if(d.role()==null||d.role()==Role.ADMIN)throw badInput("Only teacher/student accounts allowed");String username=d.username()==null?null:d.username().trim();if(username==null||username.isBlank()||d.password()==null||d.password().length()<8)throw badInput("Username and password (8+ chars) required");if(users.findByUsername(username).isPresent())throw new ResponseStatusException(HttpStatus.CONFLICT,"Username exists");UserAccount u=new UserAccount();u.username=username;u.passwordHash=encoder.encode(d.password());u.role=d.role();u.enabled=true;if(u.role==Role.STUDENT){if(d.studentId()==null)throw badInput("studentId is required");u.student=students.findById(d.studentId()).orElseThrow(()->badInput("Invalid studentId"));}else{if(d.teacherId()==null)throw badInput("teacherId is required");u.teacher=teachers.findById(d.teacherId()).orElseThrow(()->badInput("Invalid teacherId"));}users.save(u);return Map.of("id",u.id,"username",u.username,"role",u.role.name());}
 @GetMapping("/users") public List<Map<String,Object>> list(){return users.findAll().stream().map(u->Map.<String,Object>of("id",u.id,"username",u.username,"role",u.role.name(),"enabled",u.enabled)).toList();}
 @GetMapping("/stats") public Map<String,Object> stats(){return Map.of("students",students.count(),"classes",classes.count(),"faculties",faculties.count(),"years",years.count());}
}