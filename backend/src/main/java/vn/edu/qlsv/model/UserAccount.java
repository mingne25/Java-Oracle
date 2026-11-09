
package vn.edu.qlsv.model;

import jakarta.persistence.*;
import org.hibernate.type.NumericBooleanConverter;

@Entity
@Table(name = "USERS")
public class UserAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "USERNAME")
    public String username;

    @Column(name = "PASSWORD_HASH")
    public String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(name = "ROLE")
    public Role role;

    // Chuyển Boolean thành NUMBER (1 = true, 0 = false)
    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "ENABLED", nullable = false)
    public Boolean enabled = true;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "STUDENT_ID")
    public Student student;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "TEACHER_ID")
    public Teacher teacher;
}
