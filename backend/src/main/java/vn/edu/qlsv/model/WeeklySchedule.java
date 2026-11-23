package vn.edu.qlsv.model;

import jakarta.persistence.*;
import org.hibernate.type.NumericBooleanConverter;
import java.time.LocalDate;

@Entity
@Table(name = "WEEKLY_SCHEDULES")
public class WeeklySchedule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @ManyToOne(fetch = FetchType.EAGER, optional = false)
    @JoinColumn(name = "CLASSROOM_SUBJECT_ID", nullable = false)
    public ClassroomSubject classroomSubject;

    @Column(name = "DAY_OF_WEEK", nullable = false)
    public Integer dayOfWeek;

    @Column(name = "START_MINUTE", nullable = false)
    public Integer startMinute;

    @Column(name = "END_MINUTE", nullable = false)
    public Integer endMinute;

    @Column(name = "ROOM")
    public String room;

    @Column(name = "EFFECTIVE_FROM", nullable = false)
    public LocalDate effectiveFrom;

    @Column(name = "EFFECTIVE_TO")
    public LocalDate effectiveTo;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "ACTIVE", nullable = false)
    public Boolean active = true;
}
