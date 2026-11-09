-- Run once on an existing QLSV schema to enable class-teacher assignments.
ALTER TABLE classrooms ADD teacher_id NUMBER;

ALTER TABLE classrooms ADD CONSTRAINT fk_classroom_teacher
    FOREIGN KEY ( teacher_id ) REFERENCES teachers ( id );

CREATE INDEX ix_class_teacher ON
    classrooms (
        teacher_id
    );
