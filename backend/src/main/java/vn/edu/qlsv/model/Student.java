package vn.edu.qlsv.model;
import jakarta.persistence.*;
import java.time.LocalDate;
@Entity
@Table(name="STUDENTS")
public class Student {
@Id @GeneratedValue(strategy=GenerationType.IDENTITY) public Long id;
@Column(name="CODE") public String code;
@Column(name="FULL_NAME") public String fullName;
@Column(name="DATE_OF_BIRTH") public LocalDate dateOfBirth;
@Column(name="GENDER") public String gender;
@Column(name="EMAIL") public String email;
@Column(name="PHONE") public String phone;
@Enumerated(EnumType.STRING) @Column(name="STATUS") public StudentStatus status;
@ManyToOne(fetch=FetchType.EAGER) @JoinColumn(name="CLASSROOM_ID") public Classroom classroom;
}