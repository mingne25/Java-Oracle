package vn.edu.qlsv.model;
import jakarta.persistence.*;
import java.time.LocalDate;
@Entity
@Table(name="TEACHERS")
public class Teacher {
@Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
@Column(name="CODE") public String code;
@Column(name="FULL_NAME") public String fullName;
@Column(name="EMAIL") public String email;
@ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="FACULTY_ID") public Faculty faculty;
}