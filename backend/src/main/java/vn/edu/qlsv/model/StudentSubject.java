package vn.edu.qlsv.model;

import jakarta.persistence.*;

@Entity
@Table(name = "STUDENT_SUBJECTS", uniqueConstraints = {
        @UniqueConstraint(name = "uq_student_class_subject", columnNames = { "STUDENT_ID", "CLASSROOM_SUBJECT_ID" })
})
public class StudentSubject {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "STUDENT_ID", nullable = false)
    public Student student;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "CLASSROOM_SUBJECT_ID", nullable = false)
    public ClassroomSubject classroomSubject;

    @Column(name = "CLASSROOM_ID", nullable = false)
    public Long classroomId;

    @Column(name = "ENROLLED_AT", insertable = false, updatable = false)
    public java.time.LocalDateTime enrolledAt;
}
