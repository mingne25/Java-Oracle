package vn.edu.qlsv.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.security.core.Authentication;
import vn.edu.qlsv.model.*;
import vn.edu.qlsv.repository.*;
import java.util.*;
@RestController @RequestMapping("/api/catalog") public class CatalogController {
 private final CourseYearRepository years;private final FacultyRepository faculties;private final ClassroomRepository classes;private final SubjectRepository subjects;private final TeacherRepository teachers;private final StudentRepository students;private final UserAccountRepository users;
 public CatalogController(CourseYearRepository y,FacultyRepository f,ClassroomRepository c,SubjectRepository s,TeacherRepository t,StudentRepository st,UserAccountRepository u){years=y;faculties=f;classes=c;subjects=s;teachers=t;students=st;users=u;}
 private JpaRepository<?,Long> repository(String type){return switch(type){case "years"->years;case "faculties"->faculties;case "classes"->classes;case "subjects"->subjects;case "teachers"->teachers;case "students"->students;default->throw new ResponseStatusException(HttpStatus.NOT_FOUND);};}
 record StudentSummary(Long id,String code,String fullName,String classroomName,StudentStatus status){}
 private boolean isAdmin(Authentication auth){return auth.getAuthorities().stream().anyMatch(a->a.getAuthority().equals("ROLE_ADMIN"));}
 private Long teacherFaculty(Authentication auth){var user=users.findByUsername(auth.getName()).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));if(user.teacher==null||user.teacher.faculty==null)throw new ResponseStatusException(HttpStatus.NOT_FOUND);return user.teacher.faculty.id;}
 private StudentSummary summary(Student s){return new StudentSummary(s.id,s.code,s.fullName,s.classroom==null?null:s.classroom.name,s.status);}
 @GetMapping("/{type}") public Object list(@PathVariable String type,Authentication auth){if(type.equals("students")&&!isAdmin(auth)){Long facultyId=teacherFaculty(auth);return students.findByClassroom_Faculty_Id(facultyId).stream().map(this::summary).toList();}return repository(type).findAll();}
 @GetMapping("/{type}/{id}") public Object one(@PathVariable String type,@PathVariable Long id,Authentication auth){if(type.equals("students")&&!isAdmin(auth)){Long facultyId=teacherFaculty(auth);Student s=students.findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));if(s.classroom==null||!s.classroom.faculty.id.equals(facultyId))throw new ResponseStatusException(HttpStatus.NOT_FOUND);return summary(s);}return repository(type).findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));}
 @PostMapping("/{type}") @Transactional public Object create(@PathVariable String type,@RequestBody Map<String,Object> data){return save(type,null,data);}
 @PutMapping("/{type}/{id}") @Transactional public Object update(@PathVariable String type,@PathVariable Long id,@RequestBody Map<String,Object> data){return save(type,id,data);}
 private ResponseStatusException badInput(String message){return new ResponseStatusException(HttpStatus.BAD_REQUEST,message);}
 private String str(Map<String,Object> d,String k){Object v=d.get(k);return v==null?null:v.toString().trim();}
 private Long number(Map<String,Object> d,String k){String v=str(d,k);if(v==null||v.isBlank())return null;try{return Long.valueOf(v);}catch(NumberFormatException e){throw badInput(k+" must be a whole number");}}
 private Long requiredNumber(Map<String,Object> d,String k){Long v=number(d,k);if(v==null)throw badInput(k+" is required");return v;}
 private Integer integer(Map<String,Object> d,String k){String v=str(d,k);if(v==null||v.isBlank())throw badInput(k+" is required");try{return Integer.valueOf(v);}catch(NumberFormatException e){throw badInput(k+" must be a whole number");}}
 private <T> T required(Optional<T> value){return value.orElseThrow(()->badInput("Invalid reference"));}
 private void nonblank(String s,String key){if(s==null||s.isBlank())throw badInput(key+" is required");}
 private java.time.LocalDate date(String value){try{return java.time.LocalDate.parse(value);}catch(java.time.format.DateTimeParseException e){throw badInput("dateOfBirth must use YYYY-MM-DD");}}
 private StudentStatus status(String value){try{return StudentStatus.valueOf(value);}catch(IllegalArgumentException e){throw badInput("Invalid student status");}}
 private String gender(String value){if(value==null||value.isBlank())return null;return switch(value.trim().toUpperCase(Locale.ROOT)){case "MALE","NAM"->"MALE";case "FEMALE","NỮ","NU"->"FEMALE";case "OTHER","KHÁC","KHAC"->"OTHER";default->throw badInput("Invalid gender");};}
 private boolean isOccupying(StudentStatus status){return status==StudentStatus.STUDYING||status==StudentStatus.SUSPENDED||status==StudentStatus.RESERVED;}
 private void capacity(Classroom c,Long exclude){List<StudentStatus> occupying=List.of(StudentStatus.STUDYING,StudentStatus.SUSPENDED,StudentStatus.RESERVED);long count=exclude==null?students.countByClassroom_IdAndStatusIn(c.id,occupying):students.countByClassroom_IdAndStatusInAndIdNot(c.id,occupying,exclude);if(count>=c.maxStudents)throw new ResponseStatusException(HttpStatus.CONFLICT,"Classroom is full");}
 private Object save(String type,Long id,Map<String,Object> d){
 switch(type){
 case "years":{CourseYear x=id==null?new CourseYear():required(years.findById(id));x.code=str(d,"code");x.name=str(d,"name");nonblank(x.code,"code");nonblank(x.name,"name");x.startYear=integer(d,"startYear");return years.save(x);}
 case "faculties":{Faculty x=id==null?new Faculty():required(faculties.findById(id));x.code=str(d,"code");x.name=str(d,"name");nonblank(x.code,"code");nonblank(x.name,"name");x.courseYear=required(years.findById(requiredNumber(d,"courseYearId")));return faculties.save(x);}
 case "classes":{Classroom x=id==null?new Classroom():required(classes.findById(id));x.code=str(d,"code");x.name=str(d,"name");nonblank(x.code,"code");nonblank(x.name,"name");x.faculty=required(faculties.findById(requiredNumber(d,"facultyId")));x.maxStudents=50;return classes.save(x);}
 case "subjects":{Subject x=id==null?new Subject():required(subjects.findById(id));x.code=str(d,"code");x.name=str(d,"name");nonblank(x.code,"code");nonblank(x.name,"name");x.faculty=required(faculties.findById(requiredNumber(d,"facultyId")));return subjects.save(x);}
 case "teachers":{Teacher x=id==null?new Teacher():required(teachers.findById(id));x.code=str(d,"code");x.fullName=str(d,"fullName");x.email=str(d,"email");nonblank(x.code,"code");nonblank(x.fullName,"fullName");x.faculty=required(faculties.findById(requiredNumber(d,"facultyId")));return teachers.save(x);}
 case "students":{Student x=id==null?new Student():required(students.findById(id));StudentStatus previousStatus=x.status;x.code=str(d,"code");x.fullName=str(d,"fullName");x.email=str(d,"email");x.phone=str(d,"phone");x.gender=gender(str(d,"gender"));nonblank(x.code,"code");nonblank(x.fullName,"fullName");String dob=str(d,"dateOfBirth");if(dob!=null&&!dob.isBlank())x.dateOfBirth=date(dob);String state=str(d,"status");x.status=state==null?StudentStatus.STUDYING:status(state);Long cid=number(d,"classroomId");if(cid!=null){Classroom c=required(classes.findByIdForUpdate(cid));boolean moving=x.classroom==null||!x.classroom.id.equals(cid);boolean reactivating=isOccupying(x.status)&&(previousStatus==null||!isOccupying(previousStatus));if(isOccupying(x.status)&&(moving||reactivating))capacity(c,id);if(x.classroom!=null&&!x.classroom.faculty.id.equals(c.faculty.id))throw new ResponseStatusException(HttpStatus.CONFLICT,"Cross-faculty transfer is not permitted");x.classroom=c;}return students.save(x);}
 default:throw new ResponseStatusException(HttpStatus.NOT_FOUND);
 }}
 @DeleteMapping("/{type}/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional public void delete(@PathVariable String type,@PathVariable Long id){switch(type){case "years"->years.deleteById(id);case "faculties"->faculties.deleteById(id);case "classes"->classes.deleteById(id);case "subjects"->subjects.deleteById(id);case "teachers"->teachers.deleteById(id);case "students"->students.deleteById(id);default->throw new ResponseStatusException(HttpStatus.NOT_FOUND);}}
}