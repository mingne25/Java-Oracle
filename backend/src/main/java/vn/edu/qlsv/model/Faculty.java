package vn.edu.qlsv.model;
import jakarta.persistence.*;
import java.time.LocalDate;
@Entity
@Table(name="FACULTIES")
public class Faculty {
@Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
@Column(name="CODE") public String code;
@Column(name="NAME") public String name;
@ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="COURSE_YEAR_ID") public CourseYear courseYear;
}