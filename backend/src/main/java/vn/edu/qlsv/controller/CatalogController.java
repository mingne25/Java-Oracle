package vn.edu.qlsv.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.edu.qlsv.model.*;
import vn.edu.qlsv.repository.*;
import java.util.*;
@RestController @RequestMapping("/api/catalog") public class CatalogController {
 private final CourseYearRepository years;private final FacultyRepository faculties;private final ClassroomRepository classes;private final SubjectRepository subjects;private final TeacherRepository teachers;private final StudentRepository students;
 public CatalogController(CourseYearRepository y,FacultyRepository f,ClassroomRepository c,SubjectRepository s,TeacherRepository t,StudentRepository st){years=y;faculties=f;classes=c;subjects=s;teachers=t;students=st;}
 private JpaRepository<?,Long> repository(String type){return switch(type){case "years"->years;case "faculties"->faculties;case "classes"->classes;case "subjects"->subjects;case "teachers"->teachers;case "students"->students;default->throw new ResponseStatusException(HttpStatus.NOT_FOUND);};}
 @GetMapping("/{type}") public List<?> list(@PathVariable String type){return repository(type).findAll();}
 @GetMapping("/{type}/{id}") public Object one(@PathVariable String type,@PathVariable Long id){return repository(type).findById(id).orElseThrow(()->new ResponseStatusException(HttpStatus.NOT_FOUND));}
 @PostMapping("/{type}") @Transactional public Object create(@PathVariable String type,@RequestBody Map<String,Object> data){return save(type,null,data);}
 @PutMapping("/{type}/{id}") @Transactional public Object update(@PathVariable String type,@PathVariable Long id,@RequestBody Map<String,Object> data){return save(type,id,data);}
 private String str(Map<String,Object> d,String k){Object v=d.get(k);return v==null?null:v.toString().trim();}
 private Long number(Map<String,Object> d,String k){String v=str(d,k);return v==null||v.isBlank()?null:Long.valueOf(v);}
 private <T> T required(Optional<T> value){return value.orElseThrow(()->new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid reference"));}
 private void nonblank(String s,String key){if(s==null||s.isBlank())throw new ResponseStatusException(HttpStatus.BAD_REQUEST,key+" is required");}
 private void capacity(Classroom c,Long exclude){long count=students.findAll().stream().filter(s->s.classroom!=null&&s.classroom.id.equals(c.id)&&(exclude==null||!s.id.equals(exclude))).count();if(count>=c.maxStudents)throw new ResponseStatusException(HttpStatus.CONFLICT,"Classroom is full");}
 private Object save(String type,Long id,Map<String,Object> d){
 switch(type){
 case "years":{CourseYear x=id==null?new CourseYear():required(years.findById(id));x.code=str(d,"code");x.name=str(d,"name");nonblank(x.code,"code");nonblank(x.name,"name");x.startYear=Integer.valueOf(str(d,"startYear"));return years.save(x);}
 case "faculties":{Faculty x=id==null?new Faculty():required(faculties.findById(id));x.code=str(d,"code");x.name=str(d,"name");nonblank(x.code,"code");nonblank(x.name,"name");x.courseYear=required(years.findById(number(d,"courseYearId")));return faculties.save(x);}
 case "classes":{Classroom x=id==null?new Classroom():required(classes.findById(id));x.code=str(d,"code");x.name=str(d,"name");nonblank(x.code,"code");nonblank(x.name,"name");x.faculty=required(faculties.findById(number(d,"facultyId")));x.maxStudents=50;return classes.save(x);}
 case "subjects":{Subject x=id==null?new Subject():required(subjects.findById(id));x.code=str(d,"code");x.name=str(d,"name");nonblank(x.code,"code");nonblank(x.name,"name");x.faculty=required(faculties.findById(number(d,"facultyId")));return subjects.save(x);}
 case "teachers":{Teacher x=id==null?new Teacher():required(teachers.findById(id));x.code=str(d,"code");x.fullName=str(d,"fullName");x.email=str(d,"email");nonblank(x.code,"code");nonblank(x.fullName,"fullName");x.faculty=required(faculties.findById(number(d,"facultyId")));return teachers.save(x);}
 case "students":{Student x=id==null?new Student():required(students.findById(id));x.code=str(d,"code");x.fullName=str(d,"fullName");x.email=str(d,"email");x.phone=str(d,"phone");x.gender=str(d,"gender");nonblank(x.code,"code");nonblank(x.fullName,"fullName");if(str(d,"dateOfBirth")!=null&&!str(d,"dateOfBirth").isBlank())x.dateOfBirth=java.time.LocalDate.parse(str(d,"dateOfBirth"));x.status=str(d,"status")==null?StudentStatus.STUDYING:StudentStatus.valueOf(str(d,"status"));Long cid=number(d,"classroomId");if(cid!=null){Classroom c=required(classes.findById(cid));if(x.classroom==null||!x.classroom.id.equals(cid))capacity(c,id);if(x.classroom!=null&&!x.classroom.faculty.id.equals(c.faculty.id))throw new ResponseStatusException(HttpStatus.CONFLICT,"Cross-faculty transfer is not permitted");x.classroom=c;}return students.save(x);}
 default:throw new ResponseStatusException(HttpStatus.NOT_FOUND);
 }}
 @DeleteMapping("/{type}/{id}") @ResponseStatus(HttpStatus.NO_CONTENT) @Transactional public void delete(@PathVariable String type,@PathVariable Long id){switch(type){case "years"->years.deleteById(id);case "faculties"->faculties.deleteById(id);case "classes"->classes.deleteById(id);case "subjects"->subjects.deleteById(id);case "teachers"->teachers.deleteById(id);case "students"->students.deleteById(id);default->throw new ResponseStatusException(HttpStatus.NOT_FOUND);}}
}
