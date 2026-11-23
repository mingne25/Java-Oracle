package vn.edu.qlsv.controller;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityManagerFactory;
import jakarta.persistence.Query;
import vn.edu.qlsv.config.SecurityConfig;
import vn.edu.qlsv.model.Classroom;
import vn.edu.qlsv.model.Faculty;
import vn.edu.qlsv.model.Student;
import vn.edu.qlsv.model.StudentStatus;
import vn.edu.qlsv.model.Teacher;
import vn.edu.qlsv.model.UserAccount;
import vn.edu.qlsv.repository.*;
import java.util.List;
import java.util.Optional;

import static org.mockito.Mockito.*;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(CatalogController.class)
@Import(SecurityConfig.class)
class CatalogAccessTest {
    @Autowired
    MockMvc mvc;

    @MockBean
    EntityManagerFactory entityManagerFactory;
    @MockBean
    EntityManager entityManager;
    @MockBean
    Query sequenceQuery;

    @BeforeEach
    void configureEntityManager() {
        when(entityManagerFactory.createEntityManager()).thenReturn(entityManager);
        when(entityManager.createNativeQuery(anyString())).thenReturn(sequenceQuery);
        when(sequenceQuery.getSingleResult()).thenReturn(1L);
    }

    @MockBean
    CourseYearRepository years;
    @MockBean
    FacultyRepository faculties;
    @MockBean
    ClassroomRepository classes;
    @MockBean
    SubjectRepository subjects;
    @MockBean
    TeacherRepository teachers;
    @MockBean
    StudentRepository students;
    @MockBean
    UserAccountRepository users;
    @MockBean
    ClassroomSubjectRepository classroomSubjects;
    @MockBean
    StudentSubjectRepository studentSubjects;

    @Test
    void studentCannotReadTeacherCatalog() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/catalog/teachers").with(user("student01").roles("STUDENT")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(teachers);
    }

    @Test
    void teacherOnlyReceivesTeachersFromTheirFaculty() throws Exception {
        Faculty ownFaculty = faculty(12L);
        Teacher ownTeacher = teacher(1L, ownFaculty);
        UserAccount account = new UserAccount();
        account.username = "teacher01";
        account.teacher = teacher(10L, ownFaculty);
        when(users.findByUsername("teacher01")).thenReturn(Optional.of(account));
        when(teachers.findByFaculty_Id(12L)).thenReturn(List.of(ownTeacher));

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/catalog/teachers").with(user("teacher01").roles("TEACHER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1]").doesNotExist());

        verify(teachers).findByFaculty_Id(12L);
        verify(teachers, never()).findAll();
    }

    @Test
    void adminCanReadAllTeachers() throws Exception {
        when(teachers.findAll()).thenReturn(List.of(
                teacher(1L, faculty(12L)),
                teacher(2L, faculty(34L))));

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/catalog/teachers").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[1].id").value(2));

        verify(teachers).findAll();
    }

    @Test
    void teacherCanOnlyReadStudentsInAssignedClasses() throws Exception {
        UserAccount account = new UserAccount();
        account.username = "teacher01";
        account.teacher = teacher(7L, faculty(12L));
        when(users.findByUsername("teacher01")).thenReturn(Optional.of(account));
        when(students.findByClassroom_Teacher_Id(7L)).thenReturn(List.of(student(21L, 7L)));
        when(students.findById(22L)).thenReturn(Optional.of(student(22L, 8L)));

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/catalog/students").with(user("teacher01").roles("TEACHER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(21))
                .andExpect(jsonPath("$[1]").doesNotExist());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/catalog/students/22").with(user("teacher01").roles("TEACHER")))
                .andExpect(status().isNotFound());

        verify(students).findByClassroom_Teacher_Id(7L);
    }

    @Test
    void adminCanAssignOnlyATeacherFromTheClassFaculty() throws Exception {
        when(faculties.findById(12L)).thenReturn(Optional.of(faculty(12L)));
        when(teachers.findById(31L)).thenReturn(Optional.of(teacher(31L, faculty(12L))));
        when(teachers.findById(32L)).thenReturn(Optional.of(teacher(32L, faculty(34L))));
        when(classes.save(any(Classroom.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .post("/api/catalog/classes")
                .with(user("admin").roles("ADMIN"))
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content("{\"code\":\"C1\",\"name\":\"Class 1\",\"facultyId\":12,\"teacherId\":31}"))
                .andExpect(status().isOk());
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .post("/api/catalog/classes")
                .with(user("admin").roles("ADMIN"))
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content("{\"code\":\"C2\",\"name\":\"Class 2\",\"facultyId\":12,\"teacherId\":32}"))
                .andExpect(status().isBadRequest());

        verify(classes, times(1)).save(argThat(classroom -> classroom.teacher.id.equals(31L)));
    }

    @Test
    void teacherCanReadStudentsOnlyFromTheirAssignedClassEndpoint() throws Exception {
        UserAccount account = new UserAccount();
        account.username = "teacher01";
        account.teacher = teacher(7L, faculty(12L));
        when(users.findByUsername("teacher01")).thenReturn(Optional.of(account));

        Classroom assigned = new Classroom();
        assigned.id = 107L;
        assigned.code = "LOP107";
        assigned.name = "CNTT1";
        assigned.faculty = faculty(12L);
        assigned.teacher = account.teacher;
        assigned.maxStudents = 50;
        when(classes.findById(107L)).thenReturn(Optional.of(assigned));
        when(students.findByClassroom_Id(107L)).thenReturn(List.of(student(21L, 7L)));
        when(students.countByClassroom_IdAndStatusIn(eq(107L), anyCollection())).thenReturn(1L);

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/catalog/classes/107/students").with(user("teacher01").roles("TEACHER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.classroom.name").value("CNTT1"))
                .andExpect(jsonPath("$.students[0].id").value(21))
                .andExpect(jsonPath("$.currentCount").value(1));
    }

    @Test
    void teacherCannotReadStudentsFromAnotherTeachersClass() throws Exception {
        UserAccount account = new UserAccount();
        account.username = "teacher01";
        account.teacher = teacher(7L, faculty(12L));
        when(users.findByUsername("teacher01")).thenReturn(Optional.of(account));

        Classroom otherClass = new Classroom();
        otherClass.id = 108L;
        otherClass.name = "CNTT2";
        otherClass.teacher = teacher(8L, faculty(12L));
        when(classes.findById(108L)).thenReturn(Optional.of(otherClass));

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .get("/api/catalog/classes/108/students").with(user("teacher01").roles("TEACHER")))
                .andExpect(status().isNotFound());

        verify(students, never()).findByClassroom_Id(108L);
    }

    @Test
    void teacherCannotCreateStudentsOrUseAdminExcelImport() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .post("/api/catalog/students")
                .with(user("teacher01").roles("TEACHER"))
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content("{\\"code\\":\\"SV999\\",\\"fullName\\":\\"Test Student\\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .put("/api/catalog/students/21")
                .with(user("teacher01").roles("TEACHER"))
                .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                .content("{\\"fullName\\":\\"Changed Name\\"}"))
                .andExpect(status().isForbidden());

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .delete("/api/catalog/students/21")
                .with(user("teacher01").roles("TEACHER")))
                .andExpect(status().isForbidden());

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .post("/api/admin/import/students/preview")
                .with(user("teacher01").roles("TEACHER")))
                .andExpect(status().isForbidden());

        verifyNoInteractions(students);
    }

    private Student student(Long id, Long assignedTeacherId) {
        Classroom classroom = new Classroom();
        classroom.id = id + 100;
        classroom.name = "Class " + classroom.id;
        classroom.teacher = teacher(assignedTeacherId, faculty(12L));
        Student student = new Student();
        student.id = id;
        student.code = "SV" + id;
        student.fullName = "Student " + id;
        student.status = StudentStatus.STUDYING;
        student.classroom = classroom;
        return student;
    }

    private Faculty faculty(Long id) {
        Faculty faculty = new Faculty();
        faculty.id = id;
        faculty.name = "Faculty " + id;
        return faculty;
    }

    private Teacher teacher(Long id, Faculty faculty) {
        Teacher teacher = new Teacher();
        teacher.id = id;
        teacher.code = "GV" + id;
        teacher.fullName = "Teacher " + id;
        teacher.email = "teacher" + id + "@example.edu";
        teacher.faculty = faculty;
        return teacher;
    }
}
