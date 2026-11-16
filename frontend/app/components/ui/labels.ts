export const statusLabels: Record<string, string> = {
    STUDYING: "Đang học",
    SUSPENDED: "Tạm dừng",
    RESERVED: "Bảo lưu",
    GRADUATED: "Tốt nghiệp",
    DROPPED_OUT: "Thôi học",
    EXPELLED: "Buộc thôi học",
};

export const genderLabels: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác", Nam: "Nam", "Nữ": "Nữ", "Khác": "Khác" };
export const genderCode: Record<string, string> = { Nam: "MALE", "Nữ": "FEMALE", "Khác": "OTHER" };

export const roleLabels: Record<string, string> = {
    ADMIN: "Quản trị viên",
    TEACHER: "Giảng viên",
    STUDENT: "Sinh viên",
};
