package vn.edu.qlsv.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "ATTENDANCE", uniqueConstraints = {
        @UniqueConstraint(name = "UQ_ATT_SESSION_STUDENT",
                columnNames = { "SESSION_ID", "STUDENT_SUBJECT_ID" })
})
public class Attendance {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "SESSION_ID", nullable = false)
    public ClassSession session;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "CLASSROOM_SUBJECT_ID", nullable = false)
    public ClassroomSubject classroomSubject;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "STUDENT_SUBJECT_ID", nullable = false)
    public StudentSubject studentSubject;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "MARKED_BY_TEACHER_ID", nullable = false)
    public Teacher markedByTeacher;

    @Column(name = "STATUS", nullable = false)
    public String status;

    @Column(name = "NOTE")
    public String note;

    @Column(name = "MARKED_AT", insertable = false, updatable = false)
    public LocalDateTime markedAt;
}
