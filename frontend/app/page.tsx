"use client";
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
} from "lucide-react";

type Item = Record<string, any>;
type Field = [string, string, string?];
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const STUDENT_PAGE_SIZE = 25;
const tabs = [
    ["years", "Khóa học"],
    ["faculties", "Khoa"],
    ["classes", "Lớp học"],
    ["subjects", "Môn học"],
    ["teachers", "Giảng viên"],
    ["students", "Sinh viên"],
] as const;
const specs: Record<string, Field[]> = {
    years: [
        ["code", "Mã khóa"],
        ["name", "Tên khóa"],
        ["startYear", "Năm bắt đầu", "number"],
    ],
    faculties: [
        ["code", "Mã khoa"],
        ["name", "Tên khoa"],
        ["courseYearId", "Khóa học", "years"],
    ],
    classes: [
        ["code", "Mã lớp"],
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
const statusLabels: Record<string, string> = {
    STUDYING: "Đang học",
    SUSPENDED: "Tạm dừng",
    RESERVED: "Bảo lưu",
    GRADUATED: "Tốt nghiệp",
    DROPPED_OUT: "Thôi học",
    EXPELLED: "Buộc thôi học",
};
const genderLabels: Record<string, string> = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác", Nam: "Nam", "Nữ": "Nữ", "Khác": "Khác" };
const genderCode: Record<string, string> = { Nam: "MALE", "Nữ": "FEMALE", "Khác": "OTHER" };
const roleLabels: Record<string, string> = {
    ADMIN: "Quản trị viên",
    TEACHER: "Giảng viên",
    STUDENT: "Sinh viên",
};
const icons: Record<string, any> = {
    dashboard: LayoutDashboard,
    students: GraduationCap,
    teachers: UsersRound,
    classes: School,
    faculties: Building2,
    years: CalendarDays,
    subjects: BookOpen,
    accounts: ShieldCheck,
    profile: UserRound,
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
const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200";
const panel = "glass rounded-[22px]";
const shortName = (x: Item) => x.name || x.fullName || "—";
function Initials({
    name,
    size = "md",
}: {
    name: string;
    size?: "sm" | "md" | "lg";
}) {
    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/35 to-teal-500/25 font-bold text-emerald-100 ring-1 ring-emerald-300/20 ${size === "lg" ? "h-14 w-14 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"}`}
        >
            {name
                .trim()
                .split(/\s+/)
                .slice(-2)
                .map((s) => s[0]?.toUpperCase())
                .join("") || "U"}
        </span>
    );
}
function Status({ value }: { value: string }) {
    const good = value === "STUDYING" || value === "ACTIVE";
    const mid = value === "RESERVED" || value === "SUSPENDED";
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${good ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : mid ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-slate-500/25 bg-slate-500/10 text-slate-700"}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${good ? "bg-emerald-400" : mid ? "bg-amber-400" : "bg-slate-400"}`}
            />
            {statusLabels[value] || value}
        </span>
    );
}
function Login({
    onLogin,
    error,
    loading,
}: {
    onLogin: (u: string, p: string) => Promise<void>;
    error: string;
    loading: boolean;
}) {
    const [u, setU] = useState(""),
        [p, setP] = useState(""),
        [show, setShow] = useState(false);
    return (
        <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f4faf6] px-5 py-10">
            <div className="orb left-[-120px] top-[-140px] h-[500px] w-[500px] bg-emerald-500" />
            <div className="orb bottom-[-160px] right-[-120px] h-[550px] w-[550px] bg-lime-400" />
            <div className="ambient-grid absolute inset-0" />
            <div className="relative grid w-full max-w-[1020px] overflow-hidden rounded-[32px] border border-emerald-900/10 bg-white/95 shadow-[0_40px_140px_#0008] lg:grid-cols-2">
                <div
                    data-emerald-hero="true"
                    className="relative hidden min-h-[620px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[#064e3b] via-[#047857] to-[#16a34a] p-11 lg:flex"
                >
                    <div className="absolute -right-20 top-32 h-80 w-80 rounded-full border border-white/20" />
                    <div className="absolute -right-3 top-44 h-56 w-56 rounded-full border border-white/20" />
                    <div className="absolute bottom-24 left-[-90px] h-72 w-72 rounded-full bg-lime-200/20 blur-3xl" />
                    <div className="relative flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                            <GraduationCap size={27} />
                        </div>
                        <div>
                            <p className="text-2xl font-black tracking-tight">
                                Campus<span className="text-lime-300">.</span>
                            </p>
                            <p className="text-[10px] uppercase tracking-[.3em] text-white/65">
                                Smart student management
                            </p>
                        </div>
                    </div>
                    <div className="relative">
                        <div className="mb-7 flex h-20 w-20 items-center justify-center rounded-[25px] border border-white/30 bg-white/10 shadow-2xl backdrop-blur-xl">
                            <Sparkles size={42} className="text-lime-200" />
                        </div>
                        <h1 className="text-[48px] font-black leading-[1.08] tracking-tight">
                            Quản lý giáo dục.
                            <br />
                            <span className="text-lime-200">Tương lai số.</span>
                        </h1>
                        <p className="mt-6 max-w-[330px] text-sm leading-7 text-emerald-100/80">
                            Một không gian thống nhất cho quản trị, giảng viên và sinh viên.
                            Mọi dữ liệu, mọi trải nghiệm — kết nối liền mạch.
                        </p>
                        <div className="mt-9 flex items-center gap-3">
                            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs">
                                Spring Boot
                            </span>
                            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs">
                                Next.js
                            </span>
                            <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs">
                                Oracle 26ai
                            </span>
                        </div>
                    </div>
                    <p className="relative text-xs text-white/55">
                        © 2026 Emerald Campus · Student Management Platform
                    </p>
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-14">
                    <div className="mb-9 flex items-center gap-2 lg:hidden">
                        <GraduationCap className="text-green-400" />
                        <span className="text-xl font-black">Emerald Campus.</span>
                    </div>
                    <div className="mb-8">
                        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-green-400/20 bg-green-400/10 px-3 py-1.5 text-xs font-semibold text-green-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                            CỔNG THÔNG TIN ĐIỆN TỬ
                        </div>
                        <h2 className="text-3xl font-black tracking-tight sm:text-4xl">
                            Chào mừng trở lại <span className="inline-block">👋</span>
                        </h2>
                        <p className="mt-3 text-sm text-slate-500">
                            Đăng nhập để truy cập không gian quản lý của bạn.
                        </p>
                    </div>
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            void onLogin(u, p);
                        }}
                        className="space-y-5"
                    >
                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold text-slate-700">
                                Tên đăng nhập
                            </span>
                            {/* <div className="relative">
                                <UserRound
                                    size={18}
                                    className="absolute left-4 top-3.5 text-slate-500"
                                />
                                <input
                                    className="soft-input pl-12"
                                    autoComplete="username"
                                    placeholder="Nhập tên đăng nhập"
                                    value={u}
                                    onChange={(e) => setU(e.target.value)}
                                    required
                                />
                            </div> */}
                            <div className="flex w-full items-center gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 transition-all focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
                                <UserRound
                                    size={18}
                                    className="shrink-0 text-slate-500"
                                />

                                <input
                                    type="text"
                                    className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                                    autoComplete="username"
                                    placeholder="Nhập tên đăng nhập"
                                    value={u}
                                    onChange={(e) => setU(e.target.value)}
                                    required
                                />
                            </div>
                        </label>
                        <label className="block">
                            <span className="mb-2 block text-xs font-semibold text-slate-700">
                                Mật khẩu
                            </span>
                            {/* <div className="relative">
                                <LockKeyhole
                                    size={18}
                                    className="absolute left-4 top-3.5 text-slate-500"
                                />
                                <input
                                    className="soft-input pl-12 pr-12"
                                    type={show ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Nhập mật khẩu"
                                    value={p}
                                    onChange={(e) => setP(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    onClick={() => setShow(!show)}
                                    className="absolute right-4 top-3.5 text-slate-500 hover:text-white"
                                >
                                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div> */}
                            <div className="flex w-full items-center gap-3 rounded-xl border border-green-200 bg-white px-4 py-3 transition-all focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-100">
                                <LockKeyhole
                                    size={18}
                                    className="shrink-0 text-slate-500"
                                />

                                <input
                                    className="min-w-0 flex-1 border-none bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                                    type={show ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="Nhập mật khẩu"
                                    value={p}
                                    onChange={(e) => setP(e.target.value)}
                                    required
                                />

                                <button
                                    type="button"
                                    aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    aria-pressed={show}
                                    onClick={() => setShow(!show)}
                                    className="flex shrink-0 items-center justify-center text-slate-500 transition-colors hover:text-green-600"
                                >
                                    {show ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </label>
                        {error && (
                            <div
                                role="alert"
                                className="flex items-start gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-300"
                            >
                                <AlertCircle size={18} className="shrink-0" />
                                {error}
                            </div>
                        )}
                        <button
                            disabled={loading}
                            className={`${btn} gradient-button mt-2 w-full py-3.5 text-white`}
                        >
                            {loading ? "Đang xác thực..." : "Đăng nhập hệ thống"}
                            <ArrowRight size={18} />
                        </button>
                    </form>
                    <div className="mt-10 flex items-center justify-center gap-2 text-xs text-slate-500">
                        <ShieldCheck size={15} className="text-emerald-400" /> Kết nối được
                        bảo vệ · Phân quyền theo vai trò
                    </div>
                </div>
            </div>
        </div>
    );
}
export default function Page() {
    const [user, setUser] = useState<Item | null>(null),
        [loading, setLoading] = useState(true),
        [loginError, setLoginError] = useState(""),
        [tab, setTab] = useState("dashboard"),
        [data, setData] = useState<Item[]>([]),
        [listLoading, setListLoading] = useState(false),
        [listError, setListError] = useState(""),
        [studentPage, setStudentPage] = useState(0),
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
            const keys = ["years", "faculties", "classes", "students", "teachers"];
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
        listLoadId.current += 1;
        setProfile(null);
        setError("");
        setMessage("");
    }
    function navigate(t: string) {
        const allowedTabs = user?.role === "ADMIN"
            ? ["dashboard", "students", "teachers", "classes", "faculties", "subjects", "years", "accounts", "profile"]
            : user?.role === "TEACHER"
                ? ["dashboard", "students", "teachers", "profile"]
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
        for (const k of ["courseYear", "faculty", "classroom", "teacher"])
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
                [
                    x.code,
                    x.name,
                    x.fullName,
                    x.email,
                    x.classroom?.name,
                    x.faculty?.name,
                    x.teacher?.fullName,
                ].some((v) =>
                    String(v || "")
                        .toLocaleLowerCase("vi")
                        .includes(query.toLocaleLowerCase("vi")),
                ),
            ),
        [data, query],
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
        ? ["students", "classes", "teachers", "subjects"]
        : ["students", "teachers", "profile"];
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
            ]
            : user?.role === "TEACHER"
                ? ["dashboard", "students", "teachers", "profile"]
                : ["profile"];
    const title =
        tab === "dashboard"
            ? "Tổng quan"
            : tab === "accounts"
                ? "Quản lý tài khoản"
                : tab === "profile"
                    ? "Hồ sơ cá nhân"
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
            <aside
                data-emerald-sidebar="true"
                className={`fixed inset-y-0 left-0 z-40 flex w-[238px] flex-col border-r border-white/[.07] bg-white/95 px-4 py-6 backdrop-blur-xl transition-transform lg:translate-x-0 ${sidebar ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="mb-10 flex items-center justify-between px-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-[#138a64] text-lg font-extrabold text-white">C</div>
                        <div>
                            <p className="text-[22px] font-black tracking-tight">Campus</p>
                            <p className="text-[9px] font-bold tracking-[.24em] text-slate-500">
                                QUẢN LÝ HỌC SINH
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setSidebar(false)}
                        className="text-slate-500 lg:hidden"
                    >
                        <X size={20} />
                    </button>
                </div>
                <div className="mb-3 px-4 text-[10px] font-bold uppercase tracking-[.22em] text-slate-300">
                    MENU CHÍNH
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto">
                    {visibleTabs.map((t) => {
                        const Icon = icons[t];
                        return (
                            <button
                                key={t}
                                onClick={() => navigate(t)}
                                className={`nav-item ${tab === t ? "active" : ""}`}
                            >
                                <Icon size={18} />
                                <span className="flex-1 text-[13px] font-semibold">
                                    {t === "dashboard"
                                        ? "Tổng quan"
                                        : t === "accounts"
                                            ? "Tài khoản"
                                            : t === "profile"
                                                ? "Hồ sơ của tôi"
                                                : tabs.find((x) => x[0] === t)?.[1]}
                                </span>
                                {tab === t && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                                )}
                            </button>
                        );
                    })}
                </nav>
                <div className="my-4 rounded-2xl border border-emerald-400/15 bg-gradient-to-br from-emerald-600/15 to-lime-600/5 p-4">
                    <div className="mb-2 flex items-center gap-2 text-xs font-bold text-emerald-200">
                        <Sparkles size={15} /> Hệ thống thông minh
                    </div>
                    <p className="text-[11px] leading-5 text-slate-500">
                        Đồng bộ dữ liệu học vụ với Oracle Database 26ai.
                    </p>
                    <div className="mt-3 flex items-center gap-2 text-[10px] text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" /> Oracle 26ai
                        được cấu hình
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="nav-item text-rose-300 hover:text-rose-200"
                >
                    <LogOut size={18} />
                    Đăng xuất
                </button>
            </aside>
            <div className="relative min-h-screen lg:pl-[238px]">
                <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-white/[.07] bg-[#0a1120]/85 px-5 backdrop-blur-xl sm:px-8">
                    <div className="flex items-center gap-4">
                        <button
                            aria-label="Mở menu"
                            onClick={() => setSidebar(true)}
                            className="hidden"
                        >
                            <Menu size={24} />
                        </button>
                        <div className="text-xs text-slate-500">
                            Hệ thống <span className="mx-2 text-slate-300">/</span>
                            <span className="font-semibold text-slate-700">{title}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 sm:gap-5">
                        <button
                            onClick={() => navigate("students")}
                            className="hidden w-[220px] items-center gap-2 rounded-[10px] border border-emerald-900/10 bg-white px-3 py-2 text-left text-xs text-slate-400 md:flex"
                            aria-label="Tìm kiếm sinh viên"
                        >
                            <Search size={15} /> Tìm kiếm...
                        </button>
                        <div className="hidden items-center gap-2 rounded-full border border-emerald-500/15 bg-emerald-500/5 px-3 py-1.5 text-[11px] text-emerald-300 md:flex">
                            <Wifi size={14} /> Oracle 26ai
                        </div>
                        <span className="hidden h-8 w-px bg-white/10 sm:block" />
                        <div className="flex items-center gap-3">
                            <Initials name={user.username} size="sm" />
                            <div className="hidden sm:block">
                                <p className="text-xs font-bold">{user.username}</p>
                                <p className="mt-0.5 text-[10px] text-slate-500">
                                    {roleLabels[user.role]}
                                </p>
                            </div>
                            <ChevronDown
                                size={15}
                                className="hidden text-slate-500 sm:block"
                            />
                        </div>
                    </div>
                </header>
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
                    {tab === "dashboard" && (
                        <div className="space-y-5">
                            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {dashboardCards.map(({ label, value, icon: Icon }) => (
                                    <article key={label} className="rounded-[14px] border border-emerald-900/10 bg-white p-4 shadow-[0_8px_24px_rgba(22,66,49,.05)] sm:p-[17px]">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-xs font-medium text-slate-500">{label}</p>
                                            <span className="grid h-[34px] w-[34px] place-items-center rounded-[10px] bg-[#eaf7f1] text-[#138a64]">
                                                <Icon size={18} />
                                            </span>
                                        </div>
                                        <p className="mt-2 text-[25px] font-bold tracking-tight text-[#18352b]">{value}</p>
                                        <p className="mt-1 text-[11px] text-[#74867f]">
                                            {label === "Tổng sinh viên" || label === "Sinh viên phụ trách"
                                                ? "Hồ sơ đang quản lý"
                                                : label.includes("Lớp")
                                                    ? "Lớp đang hoạt động"
                                                    : "Dữ liệu trong hệ thống"}
                                        </p>
                                    </article>
                                ))}
                            </section>

                            <section className="grid gap-4 xl:grid-cols-[1.65fr_.9fr]">
                                <article className="rounded-[14px] border border-emerald-900/10 bg-white p-5 shadow-[0_8px_24px_rgba(22,66,49,.05)]">
                                    <div className="mb-4 flex items-center justify-between gap-3">
                                        <div>
                                            <h2 className="text-[15px] font-bold text-[#18352b]">Sinh viên theo lớp</h2>
                                            <p className="mt-1 text-[11px] text-[#74867f]">Phân bố từ dữ liệu hiện có</p>
                                        </div>
                                        <button onClick={() => navigate("students")} className="text-[11px] font-semibold text-[#138a64] hover:text-[#0f6b50]">Xem sinh viên →</button>
                                    </div>
                                    {classDistribution.length === 0 ? (
                                        <div className="grid h-[190px] place-items-center text-sm text-slate-500">
                                            {lookup.students ? "Chưa có dữ liệu lớp để thống kê." : "Đang tải dữ liệu..."}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex h-[190px] items-end justify-around gap-3 border-b border-[#e5eee9] px-2 pt-3" style={{ backgroundImage: "repeating-linear-gradient(to bottom, transparent 0, transparent 46px, #edf3ef 47px, #edf3ef 48px)" }}>
                                                {classDistribution.map(([name, count]) => {
                                                    const maxCount = Math.max(...classDistribution.map(([, total]) => total), 1);
                                                    const height = Math.max(10, Math.round((count / maxCount) * 100));
                                                    return (
                                                        <div key={name} className="relative flex h-full min-w-0 flex-1 items-end justify-center">
                                                            <div title={`${name}: ${count}`} className="w-4 rounded-t-md bg-[#138a64]" style={{ height: `${height}%` }} />
                                                            <span className="absolute -bottom-6 max-w-full truncate text-[10px] text-[#97a59e]" title={name}>{name}</span>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            <div className="mt-9 flex items-center gap-2 text-[10px] text-[#74867f]">
                                                <span className="h-[7px] w-[7px] rounded-full bg-[#138a64]" /> Số sinh viên
                                            </div>
                                        </>
                                    )}
                                </article>

                                <article className="rounded-[14px] border border-emerald-900/10 bg-white p-5 shadow-[0_8px_24px_rgba(22,66,49,.05)]">
                                    <div className="mb-4">
                                        <h2 className="text-[15px] font-bold text-[#18352b]">Thao tác nhanh</h2>
                                        <p className="mt-1 text-[11px] text-[#74867f]">Truy cập chức năng thường dùng</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 xl:grid-cols-1">
                                        {dashboardActions.map((action) => {
                                            const Icon = icons[action];
                                            const label = action === "profile"
                                                ? "Hồ sơ cá nhân"
                                                : tabs.find((item) => item[0] === action)?.[1] || action;
                                            return (
                                                <button key={action} onClick={() => navigate(action)} className="min-h-[68px] rounded-[11px] border border-[#e5eee9] p-3 text-left font-semibold text-[#18352b] transition hover:border-[#b7e2ce] hover:bg-[#fbfefc]">
                                                    <span className="mb-1 block text-[#138a64]"><Icon size={17} /></span>
                                                    <span className="text-[11px]">{label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    {user.role === "ADMIN" && (
                                        <button onClick={() => {
                                            setForm({ status: "STUDYING" });
                                            setEditing(null);
                                            setTab("students");
                                            setModal(true);
                                        }} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-[10px] bg-[#138a64] px-4 py-3 text-sm font-semibold text-white hover:bg-[#0f6b50]">
                                            <Plus size={16} /> Thêm sinh viên
                                        </button>
                                    )}
                                    <div className="mt-4 border-t border-[#e5eee9] pt-3">
                                        <p className="text-xs font-bold text-[#18352b]">Tình trạng dữ liệu</p>
                                        <p className="mt-1 text-[11px] text-[#74867f]">
                                            {lookup.students
                                                ? `${lookup.students.length} hồ sơ sinh viên đã được tải.`
                                                : "Đang đồng bộ dữ liệu..."}
                                        </p>
                                    </div>
                                </article>
                            </section>

                            <section className="overflow-hidden rounded-[14px] border border-emerald-900/10 bg-white shadow-[0_8px_24px_rgba(22,66,49,.05)]">
                                <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-3">
                                    <div>
                                        <h2 className="text-[15px] font-bold text-[#18352b]">Sinh viên mới cập nhật</h2>
                                        <p className="mt-1 text-[11px] text-[#74867f]">Danh sách hồ sơ sinh viên trong phạm vi của bạn</p>
                                    </div>
                                    <button onClick={() => navigate("students")} className="text-[11px] font-semibold text-[#138a64] hover:text-[#0f6b50]">Xem tất cả →</button>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[650px] border-collapse text-left">
                                        <thead className="bg-[#f7fbf8] text-[9px] font-bold uppercase tracking-[.1em] text-[#8a9a92]">
                                            <tr>
                                                <th className="px-5 py-3">Sinh viên</th>
                                                <th className="px-4 py-3">Mã sinh viên</th>
                                                <th className="px-4 py-3">Lớp</th>
                                                <th className="px-5 py-3">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {!lookup.students ? (
                                                <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-500">Đang tải dữ liệu...</td></tr>
                                            ) : lookup.students.length === 0 ? (
                                                <tr><td colSpan={4} className="px-5 py-8 text-center text-xs text-slate-500">Chưa có sinh viên trong phạm vi hiển thị.</td></tr>
                                            ) : [...lookup.students].sort((a: Item, b: Item) => Number(b.id || 0) - Number(a.id || 0)).slice(0, 5).map((student: Item) => (
                                                <tr key={student.id} className="border-t border-[#eef3f0] hover:bg-[#f5fcf7]">
                                                    <td className="px-5 py-3">
                                                        <div className="flex items-center gap-2.5">
                                                            <Initials name={student.fullName || student.name || "SV"} size="sm" />
                                                            <span className="text-[11px] font-semibold text-[#18352b]">{student.fullName || student.name || "—"}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-[11px] text-[#74867f]">{student.code || "—"}</td>
                                                    <td className="px-4 py-3 text-[11px] text-[#74867f]">{student.classroom?.name || student.classroomName || "Chưa xếp lớp"}</td>
                                                    <td className="px-5 py-3">
                                                        <span className="inline-block rounded-full bg-[#eaf7f1] px-2.5 py-1 text-[9px] font-bold text-[#247455]">
                                                            {statusLabels[student.status] || student.status || "Đang học"}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        </div>
                    )}
                    {specs[tab] && (
                        <section className={`${panel} overflow-hidden`}>
                            <div className="flex flex-wrap items-center justify-between gap-4 p-5 sm:p-6">
                                <div>
                                    <h2 className="text-base font-bold">
                                        Danh sách {title.toLowerCase()}
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500" aria-live="polite">
                                        {listLoading
                                            ? "Đang tải danh sách..."
                                            : listError
                                                ? "Không thể tải danh sách"
                                                : (tab === "teachers" && user.role === "TEACHER" ? "Phạm vi khoa của bạn · " : "") + filtered.length + " kết quả " + (query ? "phù hợp" : "trong hệ thống")}
                                    </p>
                                    {listError && (
                                        <p role="alert" className="mt-2 text-xs text-rose-400">
                                            Lỗi tải danh sách: {listError}
                                        </p>
                                    )}
                                </div>
                                <div className="flex flex-wrap items-center gap-3">
                                    <div className="relative">
                                        {/* <Search
                                            size={17}
                                            className="absolute left-3.5 top-3 text-slate-500"
                                        /> */}
                                        <input
                                            className="soft-input w-[220px] py-2.5 pl-10 text-xs sm:w-[270px]"
                                            placeholder="Tìm kiếm..."
                                            value={query}
                                            onChange={(e) => {
                                                setStudentPage(0);
                                                setQuery(e.target.value);
                                            }}
                                        />
                                    </div>
                                    <button
                                        aria-label="Làm mới"
                                        title="Làm mới dữ liệu"
                                        onClick={() => void load(tab, user.role)}
                                        disabled={listLoading}
                                        className="rounded-xl border border-emerald-900/10 bg-emerald-50 p-3 text-slate-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <RefreshCw size={16} className={listLoading ? "animate-spin" : ""} />
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table-dark w-full min-w-[700px]">
                                    <thead>
                                        <tr>
                                            <th>Thông tin</th>
                                            <th>Mã định danh</th>
                                            <th>{tab === "classes" ? "Giảng viên phụ trách" : "Liên kết"}</th>
                                            {tab === "students" && <th>Trạng thái</th>}
                                            {user.role === "ADMIN" && (
                                                <th className="text-right">Thao tác</th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {visibleRows.map((x) => (
                                            <tr key={x.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <Initials name={shortName(x)} size="sm" />
                                                        <div>
                                                            <p className="font-semibold text-slate-900">
                                                                {shortName(x)}
                                                            </p>
                                                            <p className="mt-1 text-[11px] text-slate-500">
                                                                {x.email || `ID #${x.id}`}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="rounded-lg border border-emerald-400/15 bg-emerald-400/10 px-2.5 py-1.5 font-mono text-xs text-emerald-500">
                                                        {x.code || "—"}
                                                    </span>
                                                </td>
                                                <td>
                                                    {tab === "classes"
                                                        ? x.teacher?.fullName || "Chưa phân công"
                                                        : x.classroomName ||
                                                          x.classroom?.name ||
                                                          x.faculty?.name ||
                                                          x.courseYear?.name ||
                                                          (tab === "years" ? `Năm ${x.startYear}` : "—")}
                                                </td>
                                                {tab === "students" && (
                                                    <td>
                                                        <Status value={x.status || "STUDYING"} />
                                                    </td>
                                                )}
                                                {user.role === "ADMIN" && (
                                                    <td>
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                title={tab === "classes" ? "Phân công giảng viên" : "Chỉnh sửa"}
                                                                aria-label={tab === "classes" ? `Phân công giảng viên cho ${shortName(x)}` : `Sửa ${shortName(x)}`}
                                                                onClick={() => edit(x)}
                                                                className={`inline-flex items-center gap-2 rounded-lg border border-emerald-900/10 ${tab === "classes" ? "px-3 py-2" : "p-2"} text-emerald-300 hover:bg-emerald-500/15`}
                                                            >
                                                                {tab === "classes" ? (
                                                                    <>
                                                                        <UserRoundPlus size={16} />
                                                                        <span>Phân công</span>
                                                                    </>
                                                                ) : (
                                                                    <Edit3 size={16} />
                                                                )}
                                                            </button>
                                                            <button
                                                                title="Xóa"
                                                                aria-label={`Xóa ${shortName(x)}`}
                                                                onClick={() => void remove(x.id)}
                                                                className="rounded-lg border border-emerald-900/10 p-2 text-rose-300 hover:bg-rose-500/15"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                        {(listLoading || listError || filtered.length === 0) && (
                                            <tr>
                                                <td
                                                    colSpan={
                                                        user.role === "ADMIN"
                                                            ? tab === "students"
                                                                ? 5
                                                                : 4
                                                            : tab === "students"
                                                                ? 4
                                                                : 3
                                                    }
                                                    className="py-16 text-center"
                                                >
                                                    <div className="flex flex-col items-center gap-3 text-slate-500">
                                                        {listLoading ? (
                                                            <>
                                                                <RefreshCw size={28} className="animate-spin" />
                                                                <span>Đang tải dữ liệu...</span>
                                                            </>
                                                        ) : listError ? (
                                                            <>
                                                                <AlertCircle size={28} className="text-rose-400" />
                                                                <span>Không thể tải danh sách</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Search size={28} />
                                                                <span>Chưa có dữ liệu phù hợp</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/[.07] px-6 py-4 text-xs text-slate-500">
                                <span>
                                    {listLoading
                                        ? "Đang tải..."
                                        : listError
                                            ? "Danh sách chưa tải được"
                                            : tab === "students"
                                                ? "Hiển thị " + (filtered.length === 0 ? 0 : studentPage * STUDENT_PAGE_SIZE + 1) + "–" + Math.min((studentPage + 1) * STUDENT_PAGE_SIZE, filtered.length) + " / " + filtered.length + " sinh viên · Trang " + (studentPage + 1) + "/" + pageCount
                                                : "Hiển thị " + filtered.length + " / " + data.length + " bản ghi"}
                                </span>
                                {tab === "students" && !listLoading && !listError && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setStudentPage((page) => Math.max(0, page - 1))}
                                            disabled={studentPage === 0}
                                            className="rounded-lg border border-emerald-900/10 bg-emerald-50 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Trang trước
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setStudentPage((page) => Math.min(pageCount - 1, page + 1))}
                                            disabled={studentPage >= pageCount - 1}
                                            className="rounded-lg border border-emerald-900/10 bg-emerald-50 px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Trang sau
                                        </button>
                                    </div>
                                )}
                                <span className="hidden sm:inline">Dữ liệu trực tiếp từ Oracle</span>
                            </div>
                        </section>
                    )}
                    {tab === "accounts" && user.role === "ADMIN" && (
                        <section className={`${panel} overflow-hidden`}>
                            <div className="flex items-center justify-between p-6">
                                <div>
                                    <h2 className="text-base font-bold">Tài khoản đã cấp</h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        {accounts.length} tài khoản trong hệ thống
                                    </p>
                                </div>
                                <ShieldCheck size={22} className="text-green-400" />
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table-dark w-full min-w-[570px]">
                                    <thead>
                                        <tr>
                                            <th>Tài khoản</th>
                                            <th>Vai trò</th>
                                            <th>Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts.map((a) => (
                                            <tr key={a.id}>
                                                <td>
                                                    <div className="flex items-center gap-3">
                                                        <Initials name={a.username} size="sm" />
                                                        <span className="font-semibold">{a.username}</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-500">
                                                        {roleLabels[a.role] || a.role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <Status value={a.enabled ? "ACTIVE" : "INACTIVE"} />
                                                </td>
                                            </tr>
                                        ))}
                                        {!accounts.length && (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="py-12 text-center text-slate-500"
                                                >
                                                    Chưa có tài khoản
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                    {tab === "profile" && (
                        <section className={`${panel} mx-auto w-full max-w-[980px] overflow-hidden rounded-[22px] border border-emerald-900/10 bg-white shadow-[0_18px_50px_rgba(13,87,52,.07)]`}>
                            <div className="h-2 bg-gradient-to-r from-[#0f6b50] via-[#138a64] to-[#38b982]" />
                            <div className="p-5 sm:p-8">
                                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 items-center gap-4">
                                        <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[20px] bg-[#eaf7f1] ring-1 ring-[#d4eee0]">
                                            <Initials name={profile?.fullName || user.username} size="lg" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#138a64]">Hồ sơ cá nhân</p>
                                            <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-[#18352b] sm:text-2xl">
                                                {profile?.fullName || user.username}
                                            </h2>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-[#eaf7f1] px-3 py-1 text-[11px] font-semibold text-[#0f6b50]">
                                                    {roleLabels[user.role]}
                                                </span>
                                                {profile?.code && (
                                                    <span className="text-xs font-medium text-[#74867f]">{profile.code}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#d4eee0] bg-[#f4fbf7] px-3 py-2 text-[11px] font-medium text-[#247455] sm:self-center">
                                        <span className={`h-2 w-2 rounded-full ${profile ? "bg-[#138a64]" : "animate-pulse bg-amber-400"}`} />
                                        {profile ? "Hồ sơ đã đồng bộ" : error ? "Không tải được hồ sơ" : "Đang tải hồ sơ"}
                                    </div>
                                </div>

                                <div className="my-6 h-px bg-[#e5eee9]" />

                                <div className="mb-4">
                                    <h3 className="text-sm font-bold text-[#18352b]">Thông tin chi tiết</h3>
                                    <p className="mt-1 text-xs text-[#74867f]">Thông tin cá nhân và học vụ được đồng bộ từ hệ thống.</p>
                                </div>

                                {profile ? (
                                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                        {[
                                            { label: "Mã định danh", value: profile.code, icon: Hash },
                                            { label: "Email", value: profile.email, icon: Mail },
                                            { label: "Số điện thoại", value: profile.phone, icon: Phone },
                                            { label: "Giới tính", value: genderLabels[profile.gender] || profile.gender, icon: UserRound },
                                            { label: "Trạng thái", value: statusLabels[profile.status] || profile.status, icon: CheckCircle2 },
                                            { label: "Lớp / Khoa", value: profile.classroom?.name || profile.faculty?.name, icon: Building2 },
                                        ]
                                            .filter((item) => item.value != null && item.value !== "")
                                            .map(({ label, value, icon: Icon }) => (
                                                <div key={label} className="min-w-0 rounded-xl border border-[#e5eee9] bg-[#f8fcf9] p-4 transition hover:border-[#b7e2ce] hover:bg-[#f3faf6]">
                                                    <div className="mb-3 flex items-center gap-2 text-[#138a64]">
                                                        <Icon size={16} />
                                                        <p className="text-[11px] font-medium text-[#74867f]">{label}</p>
                                                    </div>
                                                    <p className="break-words text-sm font-semibold text-[#18352b]">{String(value)}</p>
                                                </div>
                                            ))}
                                    </div>
                                ) : (
                                    <div className="rounded-xl border border-dashed border-[#cfe8d8] bg-[#f8fcf9] px-5 py-8 text-center">
                                        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#eaf7f1] text-[#138a64]">
                                            <UserRound size={20} />
                                        </div>
                                        <p className="text-sm font-semibold text-[#18352b]">Chưa tải được hồ sơ</p>
                                        <p className="mt-1 text-xs text-[#74867f]">Vui lòng thử tải lại trang hoặc liên hệ quản trị viên nếu thông tin chưa được liên kết.</p>
                                    </div>
                                )}
                            </div>
                        </section>
                    )}
                    <footer className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-emerald-900/10 pt-5 text-[11px] text-slate-600">
                        <span>© 2026 Emerald Campus · Student Management System</span>
                        <span>Designed with Next.js + Tailwind CSS · Oracle 26ai</span>
                    </footer>
                </main>
            </div>
            {modal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#052e16]/45 p-4 backdrop-blur-md"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setModal(false);
                    }}
                >
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label={
                            tab === "accounts" ? "Cấp tài khoản" : "Biểu mẫu dữ liệu"
                        }
                        className="glass my-auto w-full max-w-[680px] rounded-[26px] p-6 shadow-2xl sm:p-8"
                    >
                        <div className="mb-7 flex items-start justify-between">
                            <div>
                                <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-emerald-300">
                                    <Sparkles size={14} /> QUẢN LÝ DỮ LIỆU
                                </div>
                                <h2 className="text-2xl font-black">
                                    {tab === "accounts"
                                        ? "Cấp tài khoản mới"
                                        : `${editing !== null ? "Cập nhật" : "Thêm"} ${title.toLowerCase()}`}
                                </h2>
                                <p className="mt-2 text-xs text-slate-500">
                                    {tab === "classes"
                                        ? "Chọn giảng viên phụ trách thuộc cùng khoa với lớp."
                                        : "Điền đầy đủ thông tin trước khi lưu vào hệ thống."}
                                </p>
                            </div>
                            <button
                                aria-label="Đóng"
                                onClick={() => setModal(false)}
                                className="rounded-xl border border-emerald-900/10 p-2 text-slate-500 hover:text-white"
                            >
                                <X size={19} />
                            </button>
                        </div>
                        <form
                            onSubmit={tab === "accounts" ? createAccount : save}
                            className="grid max-h-[65vh] grid-cols-1 gap-4 overflow-y-auto pr-1 sm:grid-cols-2"
                        >
                            {tab === "accounts" ? (
                                <>
                                    <label className="block">
                                        <span className="mb-2 block text-xs font-semibold text-slate-700">
                                            Tên đăng nhập
                                        </span>
                                        <input
                                            className="soft-input"
                                            required
                                            value={account.username || ""}
                                            onChange={(e) =>
                                                setAccount({ ...account, username: e.target.value })
                                            }
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="mb-2 block text-xs font-semibold text-slate-700">
                                            Mật khẩu (ít nhất 8 ký tự)
                                        </span>
                                        <input
                                            className="soft-input"
                                            type="password"
                                            required
                                            minLength={8}
                                            value={account.password || ""}
                                            onChange={(e) =>
                                                setAccount({ ...account, password: e.target.value })
                                            }
                                        />
                                    </label>
                                    <label className="block">
                                        <span className="mb-2 block text-xs font-semibold text-slate-700">
                                            Vai trò
                                        </span>
                                        <select
                                            className="soft-input"
                                            value={account.role}
                                            onChange={(e) =>
                                                setAccount({
                                                    ...account,
                                                    role: e.target.value,
                                                    studentId: undefined,
                                                    teacherId: undefined,
                                                })
                                            }
                                        >
                                            <option value="STUDENT">Sinh viên</option>
                                            <option value="TEACHER">Giảng viên</option>
                                        </select>
                                    </label>
                                    <label className="block">
                                        <span className="mb-2 block text-xs font-semibold text-slate-700">
                                            Liên kết hồ sơ
                                        </span>
                                        <select
                                            required
                                            className="soft-input"
                                            value={
                                                account.role === "STUDENT"
                                                    ? account.studentId || ""
                                                    : account.teacherId || ""
                                            }
                                            onChange={(e) =>
                                                setAccount({
                                                    ...account,
                                                    [account.role === "STUDENT"
                                                        ? "studentId"
                                                        : "teacherId"]: Number(e.target.value),
                                                })
                                            }
                                        >
                                            <option value="">Chọn hồ sơ</option>
                                            {(
                                                lookup[
                                                account.role === "STUDENT" ? "students" : "teachers"
                                                ] || []
                                            ).map((x) => (
                                                <option key={x.id} value={x.id}>
                                                    {x.code} · {x.fullName}
                                                </option>
                                            ))}
                                        </select>
                                    </label>
                                </>
                            ) : (
                                specs[tab]?.map(([key, label, type]) => (
                                    <label className="block" key={key}>
                                        <span className="mb-2 block text-xs font-semibold text-slate-700">
                                            {label}
                                        </span>
                                        {type === "status" ? (
                                            <select
                                                className="soft-input"
                                                value={form[key] || "STUDYING"}
                                                onChange={(e) =>
                                                    setForm({ ...form, [key]: e.target.value })
                                                }
                                            >
                                                {Object.entries(statusLabels).map(([value, label]) => (
                                                    <option key={value} value={value}>
                                                        {label}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : type === "gender" ? (
                                            <select
                                                className="soft-input"
                                                value={form[key] || ""}
                                                onChange={(e) =>
                                                    setForm({ ...form, [key]: e.target.value })
                                                }
                                            >
                                                <option value="">Chọn giới tính</option>
                                                <option value="MALE">Nam</option>
                                                <option value="FEMALE">Nữ</option>
                                                <option value="OTHER">Khác</option>
                                            </select>
                                        ) : type && lookup[type] ? (
                                            <select
                                                className="soft-input"
                                                required
                                                value={form[key] || ""}
                                                onChange={(e) => {
                                                    const value = Number(e.target.value);
                                                    setForm({
                                                        ...form,
                                                        [key]: value,
                                                        ...(tab === "classes" && key === "facultyId"
                                                            ? { teacherId: undefined }
                                                            : {}),
                                                    });
                                                }}
                                            >
                                                <option value="">
                                                    {tab === "classes" && key === "teacherId"
                                                        ? form.facultyId
                                                            ? "Chọn giảng viên phụ trách"
                                                            : "Chọn khoa trước"
                                                        : "Chọn " + label.toLowerCase()}
                                                </option>
                                                {(type === "teachers"
                                                    ? lookup[type].filter(
                                                        (x) => String(x.faculty?.id) === String(form.facultyId),
                                                    )
                                                    : lookup[type]
                                                ).map((x) => (
                                                    <option key={x.id} value={x.id}>
                                                        {x.code} · {shortName(x)}
                                                    </option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input
                                                className="soft-input"
                                                type={
                                                    type === "date"
                                                        ? "date"
                                                        : type === "number"
                                                            ? "number"
                                                            : type === "email"
                                                                ? "email"
                                                                : "text"
                                                }
                                                value={form[key] ?? ""}
                                                onChange={(e) =>
                                                    setForm({ ...form, [key]: e.target.value })
                                                }
                                                required={[
                                                    "code",
                                                    "name",
                                                    "fullName",
                                                    "startYear",
                                                ].includes(key)}
                                            />
                                        )}
                                    </label>
                                ))
                            )}
                            <div className="mt-3 flex justify-end gap-3 border-t border-emerald-900/10 pt-5 sm:col-span-2">
                                <button
                                    type="button"
                                    onClick={() => setModal(false)}
                                    className={`${btn} border border-emerald-900/10 bg-emerald-50 text-slate-700 hover:bg-white/10`}
                                >
                                    Hủy
                                </button>
                                <button
                                    disabled={busy}
                                    className={`${btn} gradient-button text-white`}
                                >
                                    <Check size={17} />
                                    {busy
                                        ? "Đang lưu..."
                                        : tab === "accounts"
                                            ? "Tạo tài khoản"
                                            : "Lưu dữ liệu"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
