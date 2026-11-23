"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ClipboardCheck, Plus, RefreshCw, Save, XCircle } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type User = { role: string };
type Offering = {
    id: number;
    classroom?: { name?: string };
    subject?: { name?: string };
    teacher?: { fullName?: string };
    name?: string;
};
type Schedule = {
    id: number; classroomSubjectId: number; classroomName: string; subjectName: string;
    teacherName: string; dayOfWeek: number; startMinute: number; endMinute: number;
    room?: string; effectiveFrom: string; effectiveTo?: string; active: boolean;
};
type Session = {
    id: number; classroomSubjectId: number; classroomName: string; subjectName: string;
    teacherName: string; sessionNo?: number; sessionDate: string; startMinute: number;
    endMinute: number; room?: string; status: string; note?: string;
};
type EnrolledStudent = {
    studentSubjectId: number; studentId: number; studentCode: string; studentName: string;
    attendanceStatus?: string | null; attendanceNote?: string | null;
};
type Mark = { status: string; note: string };

function localDate(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
}
function minute(time: string) {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}
function clock(value: number) {
    return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
function auth() {
    return typeof window === "undefined" ? "" : sessionStorage.getItem("qlsv_auth") || "";
}
async function api(path: string, init: RequestInit = {}) {
    const response = await fetch(API + path, {
        ...init,
        headers: {
            Authorization: "Basic " + auth(),
            "Content-Type": "application/json",
            ...(init.headers || {}),
        },
        cache: "no-store",
    });
    if (!response.ok) {
        const raw = await response.text();
        let message = raw;
        try {
            const parsed = JSON.parse(raw);
            message = parsed.detail || parsed.message || parsed.error || raw;
        } catch { /* keep response text */ }
        throw new Error(message || `HTTP ${response.status}`);
    }
    return response.status === 204 ? null : response.json();
}

export function ScheduleAttendancePanel({ user }: { user: User }) {
    const today = useMemo(() => localDate(new Date()), []);
    const endDate = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 90);
        return localDate(d);
    }, []);
    const [offerings, setOfferings] = useState<Offering[]>([]);
    const [weekly, setWeekly] = useState<Schedule[]>([]);
    const [sessions, setSessions] = useState<Session[]>([]);
    const [students, setStudents] = useState<EnrolledStudent[]>([]);
    const [marks, setMarks] = useState<Record<number, Mark>>({});
    const [selectedSession, setSelectedSession] = useState<number | null>(null);
    const [from, setFrom] = useState(today);
    const [to, setTo] = useState(endDate);
    const [weeklyForm, setWeeklyForm] = useState({
        classroomSubjectId: "", dayOfWeek: "2", start: "07:00", end: "09:00",
        room: "", effectiveFrom: today, effectiveTo: "",
    });
    const [sessionForm, setSessionForm] = useState({
        classroomSubjectId: "", weeklyScheduleId: "", sessionNo: "",
        sessionDate: today, start: "07:00", end: "09:00", room: "", note: "",
    });
    const [busy, setBusy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            if (user.role === "ADMIN") {
                const [o, w, s] = await Promise.all([
                    api("/api/catalog/class-subjects"),
                    api("/api/admin/schedules/weekly"),
                    api(`/api/admin/schedules/sessions?from=${from}&to=${to}`),
                ]);
                setOfferings(o);
                setWeekly(w);
                setSessions(s);
            } else {
                const [w, s] = await Promise.all([
                    api("/api/teacher/schedule/weekly"),
                    api(`/api/teacher/sessions?from=${from}&to=${to}`),
                ]);
                setWeekly(w);
                setSessions(s);
            }
        } catch (e: any) {
            setError(e.message || "Không thể tải dữ liệu lịch học.");
        } finally {
            setLoading(false);
        }
    }, [user.role, from, to]);

    useEffect(() => { void load(); }, [load]);

    async function createWeekly(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true); setError(""); setMessage("");
        try {
            await api("/api/admin/schedules/weekly", {
                method: "POST",
                body: JSON.stringify({
                    classroomSubjectId: Number(weeklyForm.classroomSubjectId),
                    dayOfWeek: Number(weeklyForm.dayOfWeek),
                    startMinute: minute(weeklyForm.start),
                    endMinute: minute(weeklyForm.end),
                    room: weeklyForm.room || null,
                    effectiveFrom: weeklyForm.effectiveFrom,
                    effectiveTo: weeklyForm.effectiveTo || null,
                }),
            });
            setMessage("Đã tạo thời khóa biểu tuần.");
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    }

    async function createSession(e: React.FormEvent) {
        e.preventDefault();
        setBusy(true); setError(""); setMessage("");
        try {
            await api("/api/admin/schedules/sessions", {
                method: "POST",
                body: JSON.stringify({
                    classroomSubjectId: Number(sessionForm.classroomSubjectId),
                    weeklyScheduleId: sessionForm.weeklyScheduleId ? Number(sessionForm.weeklyScheduleId) : null,
                    sessionNo: sessionForm.sessionNo ? Number(sessionForm.sessionNo) : null,
                    sessionDate: sessionForm.sessionDate,
                    startMinute: minute(sessionForm.start),
                    endMinute: minute(sessionForm.end),
                    room: sessionForm.room || null,
                    note: sessionForm.note || null,
                }),
            });
            setMessage("Đã tạo buổi học cụ thể.");
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    }

    async function cancelSession(id: number) {
        if (!window.confirm("Bạn có chắc muốn hủy buổi học này?")) return;
        setBusy(true); setError(""); setMessage("");
        try {
            await api(`/api/admin/schedules/sessions/${id}/cancel`, { method: "PUT" });
            setMessage("Đã hủy buổi học.");
            await load();
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    }

    async function chooseSession(id: number) {
        setSelectedSession(id);
        setError(""); setMessage("");
        try {
            const rows: EnrolledStudent[] = await api(`/api/teacher/sessions/${id}/students`);
            setStudents(rows);
            const next: Record<number, Mark> = {};
            rows.forEach((s) => {
                next[s.studentSubjectId] = {
                    status: s.attendanceStatus || "",
                    note: s.attendanceNote || "",
                };
            });
            setMarks(next);
        } catch (e: any) { setError(e.message); }
    }

    async function saveAttendance() {
        if (selectedSession === null) return;
        if (students.some((s) => !marks[s.studentSubjectId]?.status)) {
            setError("Vui lòng chọn trạng thái cho tất cả sinh viên trước khi lưu.");
            return;
        }
        setBusy(true); setError(""); setMessage("");
        try {
            await api(`/api/teacher/sessions/${selectedSession}/attendance`, {
                method: "POST",
                body: JSON.stringify(students.map((s) => ({
                    studentSubjectId: s.studentSubjectId,
                    status: marks[s.studentSubjectId].status,
                    note: marks[s.studentSubjectId].note || null,
                }))),
            });
            setMessage("Đã lưu điểm danh thành công.");
            await chooseSession(selectedSession);
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    }

    const dayNames: Record<number, string> = {
        2: "Thứ Hai", 3: "Thứ Ba", 4: "Thứ Tư", 5: "Thứ Năm",
        6: "Thứ Sáu", 7: "Thứ Bảy", 8: "Chủ nhật",
    };
    const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-emerald-500";
    const labelClass = "mb-1.5 block text-xs font-semibold text-slate-600";
    const offeringName = (o: Offering) =>
        `${o.classroom?.name || "Lớp"} · ${o.subject?.name || "Môn"} · ${o.teacher?.fullName || "Giảng viên"}`;

    return (
        <div className="space-y-6">
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}
            {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{message}</div>}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <CalendarDays className="text-emerald-600" size={20} />
                        <h2 className="font-bold text-slate-800">Lịch học và các buổi học</h2>
                    </div>
                    <button onClick={() => void load()} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                        <RefreshCw size={15} /> Làm mới
                    </button>
                </div>
                <div className="mb-4 grid gap-3 sm:grid-cols-2">
                    <label><span className={labelClass}>Từ ngày</span><input className={inputClass} type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
                    <label><span className={labelClass}>Đến ngày</span><input className={inputClass} type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>
                </div>
                {loading ? <p className="py-6 text-center text-sm text-slate-500">Đang tải lịch học...</p> : (
                    <>
                        <h3 className="mb-2 text-sm font-bold text-slate-700">Thời khóa biểu tuần</h3>
                        {weekly.length === 0 ? <p className="mb-5 text-sm text-slate-500">Chưa có thời khóa biểu tuần.</p> : (
                            <div className="mb-5 overflow-x-auto">
                                <table className="w-full min-w-[650px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Thứ</th><th className="p-3">Lớp / Môn</th><th className="p-3">Giảng viên</th><th className="p-3">Thời gian</th><th className="p-3">Phòng</th><th className="p-3">Hiệu lực</th></tr></thead>
                                    <tbody>{weekly.map((w) => <tr key={w.id} className="border-t border-slate-100"><td className="p-3">{dayNames[w.dayOfWeek]}</td><td className="p-3 font-medium">{w.classroomName} · {w.subjectName}</td><td className="p-3">{w.teacherName}</td><td className="p-3">{clock(w.startMinute)}–{clock(w.endMinute)}</td><td className="p-3">{w.room || "—"}</td><td className="p-3">{w.effectiveFrom}{w.effectiveTo ? ` → ${w.effectiveTo}` : " → ..."}</td></tr>)}</tbody>
                                </table>
                            </div>
                        )}
                        <h3 className="mb-2 text-sm font-bold text-slate-700">Buổi học cụ thể</h3>
                        {sessions.length === 0 ? <p className="py-4 text-sm text-slate-500">Không có buổi học trong khoảng ngày đã chọn.</p> : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[650px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Ngày</th><th className="p-3">Lớp / Môn</th><th className="p-3">Thời gian</th><th className="p-3">Phòng</th><th className="p-3">Trạng thái</th>{user.role === "ADMIN" ? <th className="p-3">Thao tác</th> : <th className="p-3">Điểm danh</th>}</tr></thead>
                                    <tbody>{sessions.map((s) => <tr key={s.id} className="border-t border-slate-100"><td className="p-3">{s.sessionDate}</td><td className="p-3 font-medium">{s.classroomName} · {s.subjectName}<div className="text-xs font-normal text-slate-500">{s.teacherName}</div></td><td className="p-3">{clock(s.startMinute)}–{clock(s.endMinute)}</td><td className="p-3">{s.room || "—"}</td><td className="p-3">{s.status}</td><td className="p-3">{user.role === "ADMIN" ? (s.status !== "CANCELLED" && <button disabled={busy} onClick={() => void cancelSession(s.id)} className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-rose-600 hover:bg-rose-50"><XCircle size={14} /> Hủy</button>) : <button disabled={s.status === "CANCELLED"} onClick={() => void chooseSession(s.id)} className="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 disabled:opacity-40">Mở điểm danh</button>}</td></tr>)}</tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}
            </section>

            {user.role === "ADMIN" && (
                <div className="grid gap-6 xl:grid-cols-2">
                    <form onSubmit={createWeekly} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2"><Plus size={18} className="text-emerald-600" /><h2 className="font-bold text-slate-800">Tạo thời khóa biểu tuần</h2></div>
                        <label><span className={labelClass}>Lớp / môn / giảng viên</span><select required className={inputClass} value={weeklyForm.classroomSubjectId} onChange={(e) => setWeeklyForm({ ...weeklyForm, classroomSubjectId: e.target.value })}><option value="">Chọn phân công lớp – môn</option>{offerings.map((o) => <option key={o.id} value={o.id}>{offeringName(o)}</option>)}</select></label>
                        <div className="grid grid-cols-2 gap-3">
                            <label><span className={labelClass}>Thứ</span><select className={inputClass} value={weeklyForm.dayOfWeek} onChange={(e) => setWeeklyForm({ ...weeklyForm, dayOfWeek: e.target.value })}>{Object.entries(dayNames).map(([v, n]) => <option key={v} value={v}>{n}</option>)}</select></label>
                            <label><span className={labelClass}>Phòng học</span><input className={inputClass} value={weeklyForm.room} onChange={(e) => setWeeklyForm({ ...weeklyForm, room: e.target.value })} /></label>
                            <label><span className={labelClass}>Bắt đầu</span><input required type="time" className={inputClass} value={weeklyForm.start} onChange={(e) => setWeeklyForm({ ...weeklyForm, start: e.target.value })} /></label>
                            <label><span className={labelClass}>Kết thúc</span><input required type="time" className={inputClass} value={weeklyForm.end} onChange={(e) => setWeeklyForm({ ...weeklyForm, end: e.target.value })} /></label>
                            <label><span className={labelClass}>Ngày bắt đầu áp dụng</span><input required type="date" className={inputClass} value={weeklyForm.effectiveFrom} onChange={(e) => setWeeklyForm({ ...weeklyForm, effectiveFrom: e.target.value })} /></label>
                            <label><span className={labelClass}>Ngày kết thúc (không bắt buộc)</span><input type="date" className={inputClass} value={weeklyForm.effectiveTo} onChange={(e) => setWeeklyForm({ ...weeklyForm, effectiveTo: e.target.value })} /></label>
                        </div>
                        <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} /> Lưu thời khóa biểu</button>
                    </form>

                    <form onSubmit={createSession} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-2"><Plus size={18} className="text-emerald-600" /><h2 className="font-bold text-slate-800">Tạo buổi học cụ thể</h2></div>
                        <label><span className={labelClass}>Lớp / môn / giảng viên</span><select required className={inputClass} value={sessionForm.classroomSubjectId} onChange={(e) => setSessionForm({ ...sessionForm, classroomSubjectId: e.target.value, weeklyScheduleId: "" })}><option value="">Chọn phân công lớp – môn</option>{offerings.map((o) => <option key={o.id} value={o.id}>{offeringName(o)}</option>)}</select></label>
                        <label><span className={labelClass}>Lịch tuần nguồn (có thể bỏ trống để tạo độc lập)</span><select className={inputClass} value={sessionForm.weeklyScheduleId} onChange={(e) => setSessionForm({ ...sessionForm, weeklyScheduleId: e.target.value })}><option value="">Buổi học độc lập</option>{weekly.filter((w) => String(w.classroomSubjectId) === sessionForm.classroomSubjectId).map((w) => <option key={w.id} value={w.id}>{dayNames[w.dayOfWeek]} · {clock(w.startMinute)}–{clock(w.endMinute)} · {w.room || "Chưa có phòng"}</option>)}</select></label>
                        <div className="grid grid-cols-2 gap-3">
                            <label><span className={labelClass}>Ngày học</span><input required type="date" className={inputClass} value={sessionForm.sessionDate} onChange={(e) => setSessionForm({ ...sessionForm, sessionDate: e.target.value })} /></label>
                            <label><span className={labelClass}>Số buổi (tùy chọn)</span><input type="number" min="1" className={inputClass} value={sessionForm.sessionNo} onChange={(e) => setSessionForm({ ...sessionForm, sessionNo: e.target.value })} /></label>
                            <label><span className={labelClass}>Bắt đầu</span><input required type="time" className={inputClass} value={sessionForm.start} onChange={(e) => setSessionForm({ ...sessionForm, start: e.target.value })} /></label>
                            <label><span className={labelClass}>Kết thúc</span><input required type="time" className={inputClass} value={sessionForm.end} onChange={(e) => setSessionForm({ ...sessionForm, end: e.target.value })} /></label>
                            <label><span className={labelClass}>Phòng học</span><input className={inputClass} value={sessionForm.room} onChange={(e) => setSessionForm({ ...sessionForm, room: e.target.value })} /></label>
                            <label><span className={labelClass}>Ghi chú</span><input className={inputClass} value={sessionForm.note} onChange={(e) => setSessionForm({ ...sessionForm, note: e.target.value })} /></label>
                        </div>
                        <button disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} /> Lưu buổi học</button>
                    </form>
                </div>
            )}

            {user.role === "TEACHER" && selectedSession !== null && (
                <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2"><ClipboardCheck className="text-emerald-600" size={20} /><h2 className="font-bold text-slate-800">Điểm danh buổi #{selectedSession}</h2></div>
                        <button onClick={() => { setSelectedSession(null); setStudents([]); }} className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600">Đóng</button>
                    </div>
                    {students.length === 0 ? <p className="py-4 text-sm text-slate-500">Buổi học chưa có sinh viên đăng ký môn học.</p> : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[680px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Mã sinh viên</th><th className="p-3">Họ tên</th><th className="p-3">Trạng thái</th><th className="p-3">Ghi chú</th></tr></thead>
                                    <tbody>{students.map((s) => <tr key={s.studentSubjectId} className="border-t border-slate-100"><td className="p-3">{s.studentCode}</td><td className="p-3 font-medium">{s.studentName}</td><td className="p-3"><select className={inputClass} value={marks[s.studentSubjectId]?.status || ""} onChange={(e) => setMarks({ ...marks, [s.studentSubjectId]: { ...marks[s.studentSubjectId], status: e.target.value } })}><option value="">Chọn trạng thái</option><option value="PRESENT">Có mặt</option><option value="ABSENT">Vắng</option><option value="LATE">Đi trễ</option></select></td><td className="p-3"><input className={inputClass} placeholder="Ghi chú (nếu có)" value={marks[s.studentSubjectId]?.note || ""} onChange={(e) => setMarks({ ...marks, [s.studentSubjectId]: { ...marks[s.studentSubjectId], note: e.target.value } })} /></td></tr>)}</tbody>
                                </table>
                            </div>
                            <button disabled={busy} onClick={() => void saveAttendance()} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"><Save size={16} /> Lưu điểm danh</button>
                        </>
                    )}
                </section>
            )}
        </div>
    );
}
