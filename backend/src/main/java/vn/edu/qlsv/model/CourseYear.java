package vn.edu.qlsv.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "COURSE_YEARS")
public class CourseYear {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;
    @Column(name = "CODE")
    public String code;
    @Column(name = "NAME")
    public String name;
    @Column(name = "START_YEAR")
    public Integer startYear;
}