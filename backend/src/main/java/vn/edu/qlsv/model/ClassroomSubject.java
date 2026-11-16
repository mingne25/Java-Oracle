package vn.edu.qlsv.model;

import jakarta.persistence.*;

@Entity
@Table(name = "CLASSROOM_SUBJECTS", uniqueConstraints = {
        @UniqueConstraint(name = "uq_classroom_subject", columnNames = { "CLASSROOM_ID", "SUBJECT_ID" })
})
public class ClassroomSubject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "CLASSROOM_ID", nullable = false)
    public Classroom classroom;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "SUBJECT_ID", nullable = false)
    public Subject subject;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "TEACHER_ID", nullable = false)
    public Teacher teacher;
}
