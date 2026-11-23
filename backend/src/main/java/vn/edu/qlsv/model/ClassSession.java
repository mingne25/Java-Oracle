package vn.edu.qlsv.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "CLASS_SESSIONS")
public class ClassSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "WEEKLY_SCHEDULE_ID")
    public WeeklySchedule weeklySchedule;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "CLASSROOM_SUBJECT_ID", nullable = false)
    public ClassroomSubject classroomSubject;

    @Column(name = "SESSION_NO")
    public Integer sessionNo;

    @Column(name = "SESSION_DATE", nullable = false)
    public LocalDate sessionDate;

    @Column(name = "START_MINUTE", nullable = false)
    public Integer startMinute;

    @Column(name = "END_MINUTE", nullable = false)
    public Integer endMinute;

    @Column(name = "ROOM", length = 100)
    public String room;

    @Column(name = "STATUS", nullable = false, length = 20)
    public String status = "SCHEDULED";

    @Column(name = "NOTE", length = 1000)
    public String note;
}
