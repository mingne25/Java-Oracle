package vn.edu.qlsv.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import vn.edu.qlsv.config.SecurityConfig;
import vn.edu.qlsv.model.Faculty;
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
    @Autowired MockMvc mvc;

    @MockBean CourseYearRepository years;
    @MockBean FacultyRepository faculties;
    @MockBean ClassroomRepository classes;
    @MockBean SubjectRepository subjects;
    @MockBean TeacherRepository teachers;
    @MockBean StudentRepository students;
    @MockBean UserAccountRepository users;

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
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(1));

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
                .andExpect(jsonPath("$.length()").value(2));

        verify(teachers).findAll();
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
