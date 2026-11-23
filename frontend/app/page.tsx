"use client";

import { Login } from "./components/auth/Login";
import { ExcelImportPanel } from "./components/import/ExcelImportPanel";
import { ScheduleAttendancePanel } from "./components/schedule/ScheduleAttendancePanel";
import { TeachingClassesPanel } from "./components/teaching/TeachingClassesPanel";
import { ProfilePanel } from "./components/profile/ProfilePanel";
import { Sidebar } from "./components/layout/Sidebar";
import { Topbar } from "./components/layout/Topbar";
import { EntityFormModal } from "./components/entities/EntityFormModal";
import { DashboardPanel } from "./components/dashboard/DashboardPanel";
import { CatalogTable } from "./components/catalog/CatalogTable";
import { AccountTable } from "./components/accounts/AccountTable";
import { genderCode } from "./components/ui/labels";
import { type Field, type Item, btn } from "./components/ui/shared";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Activity,
    ArrowDownRight,
    ArrowRight,
    ArrowUpRight,
    BookOpen,
    CalendarDays,
    Check,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Database,
    Edit3,
    GraduationCap,
    Layers3,
    LayoutDashboard,
    LockKeyhole,
    LogOut,
    Mail,
    Menu,
    MoreHorizontal,
    Plus,
    School,
    Search,
    ShieldCheck,
    Sparkles,
    Trash2,
    UserRound,
    UserRoundPlus,
    Users,
    UsersRound,
    Wifi,
    X,
    Eye,
    EyeOff,
    RefreshCw,
    Filter,
    Hash,
    Phone,
    Building2,
    CheckCircle2,
    AlertCircle,
    FileSpreadsheet,

} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const STUDENT_PAGE_SIZE = 25;
const tabs = [
    ["years", "Khóa học"],
    ["faculties", "Khoa"],
    ["classes", "Lớp học"],
    ["teaching-classes", "Lớp giảng dạy"],
    ["subjects", "Môn học"],
    ["teachers", "Giảng viên"],
    ["students", "Sinh viên"],
    ["class-subjects", "Môn học theo lớp"],
] as const;
const specs: Record<string, Field[]> = {
    years: [
        ["name", "Tên khóa"],
        ["startYear", "Năm bắt đầu", "number"],
    ],
    faculties: [
        ["name", "Tên khoa"],
        ["courseYearId", "Khóa học", "years"],
    ],
    classes: [
        ["name", "Tên lớp"],
        ["facultyId", "Khoa", "faculties"],
        ["teacherId", "Giảng viên phụ trách", "teachers"],
    ],
    subjects: [
        ["code", "Mã môn"],
        ["name", "Tên môn"],
        ["facultyId", "Khoa", "faculties"],
    ],
    teachers: [
        ["code", "Mã giảng viên"],
        ["fullName", "Họ và tên"],
        ["email", "Email", "email"],
        ["facultyId", "Khoa", "faculties"],
    ],
    "class-subjects": [
        ["classroomId", "Lớp học", "classes"],
        ["subjectId", "Môn học", "subjects"],
        ["teacherId", "Giảng viên phụ trách", "teachers"],
    ],
    students: [
        ["code", "Mã sinh viên"],
        ["fullName", "Họ và tên"],
        ["email", "Email", "email"],
        ["phone", "Số điện thoại"],
        ["gender", "Giới tính", "gender"],
        ["dateOfBirth", "Ngày sinh", "date"],
        ["status", "Trạng thái", "status"],
        ["classroomId", "Lớp học", "classes"],
    ],
};
const icons: Record<string, any> = {
    dashboard: LayoutDashboard,
    students: GraduationCap,
    teachers: UsersRound,
    classes: School,
    faculties: Building2,
    years: CalendarDays,
    subjects: BookOpen,
    "class-subjects": BookOpen,
    "teaching-classes": BookOpen,
    accounts: ShieldCheck,
    profile: UserRound,
    schedules: CalendarDays,
    import: FileSpreadsheet,
};
const auth = () =>
    typeof window === "undefined"
        ? ""
        : sessionStorage.getItem("qlsv_auth") || "";
async function request(path: string, init: RequestInit = {}) {
    const r = await fetch(API + path, {
        ...init,
        headers: {
            Authorization: "Basic " + auth(),
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
        cache: "no-store",
    });
    if (!r.ok) {
        const body = await r.text();
        let detail = "";
        try {
            const obj = JSON.parse(body);
            detail = obj.detail || obj.message || obj.error || "";
        } catch {
            detail = body.slice(0, 180);
        }
        throw Error(detail || `Yêu cầu thất bại (HTTP ${r.status}).`);
    }
    return r.status === 204 ? null : r.json();
}
export default function Page() {
    const [user, setUser] = useState<(Item & { role: string }) | null>(null),
        [loading, setLoading] = useState(true),
        [loginError, setLoginError] = useState(""),
        [tab, setTab] = useState("dashboard"),
        [data, setData] = useState<Item[]>([]),
        [listLoading, setListLoading] = useState(false),
        [listError, setListError] = useState(""),
        [studentPage, setStudentPage] = useState(0),
        [studentClassFilter, setStudentClassFilter] = useState("ALL"),
        [selectedClass, setSelectedClass] = useState<Item | null>(null),
        [classStudents, setClassStudents] = useState<Item[]>([]),
        [classCurrentCount, setClassCurrentCount] = useState(0),
        [classDetailLoading, setClassDetailLoading] = useState(false),
        [lookup, setLookup] = useState<Record<string, Item[]>>({}),
        [stats, setStats] = useState<Item>({}),
        [accounts, setAccounts] = useState<Item[]>([]),
        [form, setForm] = useState<Item>({}),
        [editing, setEditing] = useState<number | null>(null),
        [modal, setModal] = useState(false),
        [account, setAccount] = useState<Item>({ role: "STUDENT" }),
        [error, setError] = useState(""),
        [message, setMessage] = useState(""),
        [query, setQuery] = useState(""),
        [sidebar, setSidebar] = useState(false),
        [busy, setBusy] = useState(false),
        [profile, setProfile] = useState<Item | null>(null);
    const listLoadId = useRef(0);
    const load = useCallback(async (current: string, role: string) => {
        const isList = Boolean(specs[current]);
        const loadId = ++listLoadId.current;
        if (isList) {
            setListLoading(true);
            setListError("");
            setData([]);
            setStudentPage(0);
        } else {
            setListError("");
            setListLoading(false);
        }
        setError("");
        try {
            const keys = ["years", "faculties", "classes", "students", "teachers", "subjects", "class-subjects"];
            const required = role === "ADMIN"
                ? keys
                : role === "TEACHER" && current === "dashboard"
                    ? ["classes", "students"]
                    : [];
            const results = await Promise.all(
                required.map((k) => request("/api/catalog/" + k)),
            );
            const mapped = Object.fromEntries(
                required.map((k, i) => [k, results[i]]),
            );
            setLookup(mapped);
            if (role === "TEACHER" && current === "dashboard") {
                const ownProfile = await request("/api/teacher/profile");
                setStats({
                    students: mapped.students?.length ?? 0,
                    classes: mapped.classes?.length ?? 0,
                    faculties: ownProfile.faculty ? 1 : 0,
                    years: ownProfile.faculty?.courseYear ? 1 : 0,
                });
            }
            if (specs[current]) {
                const rows = await request("/api/catalog/" + current);
                let visibleRows = rows;
                if (current === "teachers" && role === "TEACHER") {
                    const ownProfile = await request("/api/teacher/profile");
                    const facultyId = ownProfile.faculty?.id;
                    visibleRows = rows.filter((teacher: Item) => teacher.faculty?.id === facultyId);
                }
                if (loadId === listLoadId.current) setData(visibleRows);
            } else if (current === "dashboard" && role === "ADMIN")
                setStats(await request("/api/admin/stats"));
            else if (current === "accounts" && role === "ADMIN")
                setAccounts(await request("/api/admin/users"));
            else if (current === "profile")
                setProfile(await request(`/api/${role.toLowerCase()}/profile`));
        } catch (e: any) {
            if (isList) {
                if (loadId === listLoadId.current) setListError(e.message);
            } else {
                setError(e.message);
            }
        } finally {
            if (isList && loadId === listLoadId.current) setListLoading(false);
        }
    }, []);
    useEffect(() => {
        if (!auth()) {
            setLoading(false);
            return;
        }
        request("/api/me")
            .then((u) => {
                setUser(u);
                setTab(u.role === "STUDENT" ? "profile" : "dashboard");
            })
            .catch(() => sessionStorage.removeItem("qlsv_auth"))
            .finally(() => setLoading(false));
    }, []);
    useEffect(() => {
        if (user) void load(tab, user.role);
    }, [user, tab, load]);
    async function login(u: string, p: string) {
        setLoginError("");
        setLoading(true);
        sessionStorage.setItem(
            "qlsv_auth",
            btoa(unescape(encodeURIComponent(u + ":" + p))),
        );
        try {
            const current = await request("/api/me");
            setUser(current);
            setTab(current.role === "STUDENT" ? "profile" : "dashboard");
        } catch {
            sessionStorage.removeItem("qlsv_auth");
            setLoginError(
                "Thông tin đăng nhập không chính xác hoặc tài khoản bị khóa.",
            );
        } finally {
            setLoading(false);
        }
    }
    function logout() {
        sessionStorage.removeItem("qlsv_auth");
        setUser(null);
        setData([]);
        setListLoading(false);
        setListError("");
        setStudentPage(0);
        setSelectedClass(null);
        setClassStudents([]);
        listLoadId.current += 1;
        setProfile(null);
        setError("");
        setMessage("");
    }
    function navigate(t: string) {
        const allowedTabs = user?.role === "ADMIN"
            ? ["dashboard", "students", "teachers", "classes", "faculties", "subjects", "years", "accounts", "profile", "class-subjects", "schedules"]
            : user?.role === "TEACHER"
                ? ["dashboard", "classes", "teaching-classes", "teachers", "profile", "schedules"]
                : ["profile"];
        if (!allowedTabs.includes(t)) return;
        setTab(t);
        setData([]);
        setListLoading(false);
        setListError("");
        setStudentPage(0);
        listLoadId.current += 1;
        setSidebar(false);
        setQuery("");
        setError("");
        setMessage("");
        setModal(false);
        setEditing(null);
        setForm({});
    }
    async function viewClassStudents(classroom: Item) {
        setSelectedClass(classroom);
        setClassStudents([]);
        setClassDetailLoading(true);
        setError("");
        try {
            const result = await request("/api/catalog/classes/" + classroom.id + "/students");
            setSelectedClass(result.classroom);
            setClassStudents(result.students || []);
            setClassCurrentCount(result.currentCount || 0);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setClassDetailLoading(false);
        }
    }
    function closeClassStudents() {
        setSelectedClass(null);
        setClassStudents([]);
        setClassCurrentCount(0);
    }
    async function save(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            const saved = await request(
                "/api/catalog/" + tab + (editing !== null ? "/" + editing : ""),
                {
                    method: editing !== null ? "PUT" : "POST",
                    body: JSON.stringify(form),
                },
            );
            if (tab === "classes") {
                const teacherId = Number(form.teacherId);
                const classId = Number(saved?.id ?? editing);
                const persistedClasses = await request("/api/catalog/classes");
                const persisted = persistedClasses.find(
                    (item: Item) => Number(item.id) === classId,
                );
                if (
                    !teacherId ||
                    Number(saved?.teacher?.id) !== teacherId ||
                    Number(persisted?.teacher?.id) !== teacherId
                ) {
                    throw new Error(
                        "Backend chưa xác nhận lưu giảng viên cho lớp. Vui lòng kiểm tra lại dữ liệu.",
                    );
                }
            }
            setModal(false);
            setEditing(null);
            setForm({});
            setMessage("Dữ liệu đã được lưu thành công.");
            await load(tab, user!.role);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }
    async function remove(id: number) {
        if (
            !window.confirm(
                "Bạn có chắc muốn xóa bản ghi này? Thao tác không thể hoàn tác.",
            )
        )
            return;
        setError("");
        try {
            await request("/api/catalog/" + tab + "/" + id, { method: "DELETE" });
            setMessage("Đã xóa bản ghi.");
            await load(tab, user!.role);
        } catch (e: any) {
            setError(e.message);
        }
    }
    function edit(x: Item) {
        setEditing(x.id);
        const d = { ...x };
        for (const k of ["courseYear", "faculty", "classroom", "teacher", "subject", "classSubject"])
            if (x[k]) d[k + "Id"] = x[k].id;
        if (d.gender) d.gender = genderCode[d.gender] || d.gender;
        setForm(d);
        setModal(true);
    }
    async function createAccount(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
            await request("/api/admin/users", {
                method: "POST",
                body: JSON.stringify(account),
            });
            setAccount({ role: "STUDENT" });
            setModal(false);
            setMessage("Đã cấp tài khoản thành công.");
            await load("accounts", user!.role);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setBusy(false);
        }
    }
    const filtered = useMemo(
        () =>
            data.filter((x) =>
                (tab !== "students" || studentClassFilter === "ALL" || (studentClassFilter === "UNASSIGNED" ? !(x.classroom?.id ?? x.classroomId) : String(x.classroom?.id ?? x.classroomId ?? "") === studentClassFilter)) &&
                [
                    x.code,
                    x.name,
                    x.fullName,
                    x.email,
                    x.classroom?.name,
                    x.faculty?.name,
                    x.teacher?.fullName,
                    x.subject?.name,
                    x.classSubject?.subject?.name,
                    x.student?.fullName,
                    x.classSubject?.classroom?.name,
                    x.classSubject?.teacher?.fullName,
                ].some((v) =>
                    String(v || "")
                        .toLocaleLowerCase("vi")
                        .includes(query.toLocaleLowerCase("vi")),
                ),
            ),
        [data, query, studentClassFilter, tab],
    );
    const pageCount = Math.max(1, Math.ceil(filtered.length / STUDENT_PAGE_SIZE));
    const visibleRows = useMemo(
        () => tab === "students"
            ? filtered.slice(studentPage * STUDENT_PAGE_SIZE, (studentPage + 1) * STUDENT_PAGE_SIZE)
            : filtered,
        [filtered, studentPage, tab],
    );
    const dashboardCards = user?.role === "ADMIN"
        ? [
            { label: "Tổng sinh viên", value: stats.students ?? "—", icon: GraduationCap },
            { label: "Giảng viên", value: lookup.teachers?.length ?? "—", icon: UsersRound },
            { label: "Lớp học", value: stats.classes ?? "—", icon: School },
            { label: "Khoa đào tạo", value: stats.faculties ?? "—", icon: Building2 },
        ]
        : [
            { label: "Sinh viên phụ trách", value: stats.students ?? "—", icon: GraduationCap },
            { label: "Lớp được phân công", value: stats.classes ?? "—", icon: School },
            { label: "Khoa", value: stats.faculties ?? "—", icon: Building2 },
            { label: "Khóa học", value: stats.years ?? "—", icon: CalendarDays },
        ];
    const dashboardActions = user?.role === "ADMIN"
        ? ["students", "classes", "teachers", "subjects", "class-subjects"]
        : ["teaching-classes", "teachers", "profile"];
    const classDistribution = Object.entries(
        (lookup.students || []).reduce((counts: Record<string, number>, student: Item) => {
            const className = student.classroom?.name || student.classroomName || "Chưa xếp lớp";
            counts[className] = (counts[className] || 0) + 1;
            return counts;
        }, {}),
    ).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const visibleTabs =
        user?.role === "ADMIN"
            ? [
                "dashboard",
                "students",
                "teachers",
                "classes",
                "faculties",
                "subjects",
                "years",
                "accounts",
                "class-subjects",
                "schedules",
            ]
            : user?.role === "TEACHER"
                ? ["dashboard", "classes", "teaching-classes", "teachers", "profile", "schedules"]
                : ["profile"];
    const title =
        tab === "dashboard"
            ? "Tổng quan"
            : tab === "accounts"
                ? "Quản lý tài khoản"
                 : tab === "profile"
                    ? "Hồ sơ cá nhân"
                    : tab === "schedules"
                        ? "Lịch học & điểm danh"
                            : tabs.find((x) => x[0] === tab)?.[1] || "Quản lý";
    if (!user)
        return <Login onLogin={login} error={loginError} loading={loading} />;
    return (
        <div className="relative min-h-screen overflow-hidden bg-[#f4faf6] text-slate-900">


            {sidebar && (
                <button
                    aria-label="Đóng menu"
                    onClick={() => setSidebar(false)}
                    className="fixed inset-0 z-30 bg-black/70 lg:hidden"
                />
            )}
            <Sidebar sidebar={sidebar} setSidebar={setSidebar} user={user} tab={tab} visibleTabs={visibleTabs} tabs={tabs} icons={icons} navigate={navigate} logout={logout} />
            <div className="relative min-h-screen lg:pl-[238px]">
                <Topbar setSidebar={setSidebar} user={user} title={title} navigate={navigate} />
                <main className="mx-auto max-w-[1500px] px-5 pb-16 pt-8 sm:px-8">
                    <div className={`animate-rise ${tab === "dashboard" ? "mb-5" : "mb-8"} flex flex-wrap items-end justify-between gap-4`}>
                        <div>
                            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.19em] text-emerald-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> HỆ
                                THỐNG QUẢN LÝ SINH VIÊN
                            </div>
                            <h1 className="text-[27px] font-bold tracking-tight text-[#18352b] sm:text-[32px]">
                                {tab === "dashboard" ? `Xin chào, ${user.username} 👋` : title}
                                {tab !== "dashboard" && <span className="text-green-600">.</span>}
                            </h1>
                            <p className="mt-2 text-sm text-slate-500">
                                {tab === "dashboard"
                                    ? "Tổng quan nhanh về hoạt động của nhà trường."
                                    : tab === "profile"
                                        ? "Thông tin hồ sơ và tài khoản của bạn."
                                        : `Quản lý dữ liệu ${title.toLowerCase()} trên hệ thống.`}
                            </p>
                        </div>
                        {tab === "dashboard" && user.role === "ADMIN" && (
                            <button
                                onClick={() => {
                                    setForm({ status: "STUDYING" });
                                    setEditing(null);
                                    setTab("students");
                                    setModal(true);
                                }}
                                className={`${btn} gradient-button text-white`}
                            >
                                <Plus size={17} /> Thêm sinh viên
                            </button>
                        )}
                        {specs[tab] && user.role === "ADMIN" && (
                            <button
                                onClick={() => {
                                    setForm(tab === "students" ? { status: "STUDYING" } : {});
                                    setEditing(null);
                                    setModal(true);
                                }}
                                className={`${btn} gradient-button text-white`}
                            >
                                <Plus size={17} /> Thêm mới
                            </button>
                        )}
                        {tab === "students" && user.role === "ADMIN" && (
                        <div className="mt-6">
                            <ExcelImportPanel onImported={(text) => { setMessage(text); void load("students", user.role); }} />
                        </div>
                    )}
                    {tab === "accounts" && user.role === "ADMIN" && (
                            <button
                                onClick={() => {
                                    setAccount({ role: "STUDENT" });
                                    setModal(true);
                                }}
                                className={`${btn} gradient-button text-white`}
                            >
                                <UserRoundPlus size={17} /> Cấp tài khoản
                            </button>
                        )}
                    </div>
                    {error && (
                        <div
                            role="alert"
                            className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300"
                        >
                            <span className="flex items-center gap-2">
                                <AlertCircle size={17} />
                                {error}
                            </span>
                            <button
                                aria-label="Đóng thông báo lỗi"
                                onClick={() => setError("")}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    {message && (
                        <div
                            role="status"
                            className="mb-5 flex items-center justify-between gap-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300"
                        >
                            <span className="flex items-center gap-2">
                                <CheckCircle2 size={17} />
                                {message}
                            </span>
                            <button
                                aria-label="Đóng thông báo"
                                onClick={() => setMessage("")}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}
                    {tab === "teaching-classes" && <TeachingClassesPanel />}
                    {tab === "dashboard" && (
                        <DashboardPanel
                            user={user}
                            cards={dashboardCards}
                            actions={dashboardActions}
                            classDistribution={classDistribution}
                            lookup={lookup}
                            icons={icons}
                            tabs={tabs}
                            navigate={navigate}
                            setForm={setForm}
                            setEditing={setEditing}
                            setTab={setTab}
                            setModal={setModal}
                        />
                    )}
                    {tab === "classes" && selectedClass && (
                        <section className="mb-6 rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-emerald-600">Danh sách sinh viên theo lớp</p>
                                    <h2 className="mt-1 text-xl font-bold text-[#18352b]">{selectedClass.name} · {selectedClass.code}</h2>
                                    <p className="mt-1 text-sm text-slate-500">Khoa: {selectedClass.faculty?.name || "—"} · Giảng viên: {selectedClass.teacher?.fullName || "Chưa phân công"}</p>
                                    <p className="mt-1 text-sm font-medium text-slate-600">Sĩ số: {classCurrentCount}/{selectedClass.maxStudents || 50}</p>
                                </div>
                                <button onClick={closeClassStudents} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">Đóng danh sách</button>
                            </div>
                            {classDetailLoading ? (
                                <p className="py-8 text-center text-sm text-slate-500">Đang tải danh sách sinh viên...</p>
                            ) : (
                                <div className="mt-4 overflow-x-auto rounded-xl border border-slate-100">
                                    <table className="w-full min-w-[600px] text-left text-sm">
                                        <thead className="bg-emerald-50 text-xs uppercase text-slate-600"><tr><th className="p-3">Mã sinh viên</th><th className="p-3">Họ và tên</th><th className="p-3">Trạng thái</th></tr></thead>
                                        <tbody>
                                            {classStudents.map((student) => (
                                                <tr key={student.id} className="border-t border-slate-100">
                                                    <td className="p-3 font-mono text-emerald-700">{student.code}</td>
                                                    <td className="p-3 font-medium text-slate-800">{student.fullName}</td>
                                                    <td className="p-3 text-slate-600">{student.status || "—"}</td>
                                                </tr>
                                            ))}
                                            {classStudents.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500">Lớp chưa có sinh viên.</td></tr>}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    )}
                    {specs[tab] && (
                        <CatalogTable
                            tab={tab}
                            title={title}
                            user={user}
                            listLoading={listLoading}
                            listError={listError}
                            filtered={filtered}
                            query={query}
                            setQuery={setQuery}
                            onRefresh={() => void load(tab, user.role)}
                            visibleRows={visibleRows}
                            edit={edit}
                            remove={remove}
                            studentPage={studentPage}
                            setStudentPage={setStudentPage}
                            pageCount={pageCount}
                            studentPageSize={STUDENT_PAGE_SIZE}
                            data={data}
                            onViewStudents={viewClassStudents}
                            classOptions={lookup.classes || []}
                            classFilter={studentClassFilter}
                            setClassFilter={setStudentClassFilter}
                        />
                    )}
                    {tab === "accounts" && user.role === "ADMIN" && (
                        <AccountTable accounts={accounts} />
                    )}
                    {tab === "schedules" && <ScheduleAttendancePanel user={user} />}
                    {tab === "profile" && (
                        <ProfilePanel profile={profile} user={user} error={error} />
                    )}
                    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-900/10 pt-5 text-[11px] text-slate-600">
                        <span>© 2026 Emerald Campus · Student Management System</span>
                        <span>Designed with Next.js + Tailwind CSS · Oracle 26ai</span>
                    </footer>
                </main>
            </div>
            {modal && (
                <EntityFormModal
                    tab={tab}
                    title={title}
                    editing={editing}
                    form={form}
                    setForm={setForm}
                    account={account}
                    setAccount={setAccount}
                    lookup={lookup}
                    fields={specs[tab] || []}
                    busy={busy}
                    onClose={() => setModal(false)}
                    onSave={save}
                    onCreateAccount={createAccount}
                />
            )}
        </div>
    );
}
