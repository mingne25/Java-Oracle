"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Eye, RefreshCw, Users } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

type Student = {
    id: number;
    code: string;
    fullName: string;
    classroomName?: string;
    status?: string;
};
type Offering = {
    id: number;
    code: string;
    name: string;
    classroom?: { id: number; code: string; name: string; faculty?: { name: string } };
    subject?: { code: string; name: string };
    teacher?: { fullName: string };
};
type Detail = {
    offering: Offering;
    students: Student[];
    currentCount: number;
};

function auth() {
    return typeof window === "undefined" ? "" : sessionStorage.getItem("qlsv_auth") || "";
}

async function request(path: string) {
    const response = await fetch(API + path, {
        headers: { Authorization: "Basic " + auth(), "Content-Type": "application/json" },
        cache: "no-store",
    });
    if (!response.ok) {
        const raw = await response.text();
        let message = raw;
        try {
            const parsed = JSON.parse(raw);
            message = parsed.detail || parsed.message || parsed.error || raw;
        } catch { /* Keep the response text. */ }
        throw new Error(message || `Yêu cầu thất bại (HTTP ${response.status}).`);
    }
    return response.json();
}

export function TeachingClassesPanel() {
    const [offerings, setOfferings] = useState<Offering[]>([]);
    const [detail, setDetail] = useState<Detail | null>(null);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState(false);
    const [error, setError] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            setOfferings(await request("/api/catalog/teaching-classes"));
        } catch (e: any) {
            setError(e.message || "Không thể tải danh sách lớp giảng dạy.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    async function openOffering(offering: Offering) {
        setDetail(null);
        setDetailLoading(true);
        setError("");
        try {
            setDetail(await request(`/api/catalog/teaching-classes/${offering.id}/students`));
        } catch (e: any) {
            setError(e.message || "Không thể tải danh sách sinh viên của lớp môn học.");
        } finally {
            setDetailLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

            <section className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3 p-5 sm:p-6">
                    <div>
                        <div className="flex items-center gap-2 text-emerald-700">
                            <BookOpen size={19} />
                            <h2 className="font-bold">Danh sách lớp môn học được phân công</h2>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">Chỉ hiển thị các lớp và môn học được giao cho tài khoản giảng viên đang đăng nhập.</p>
                    </div>
                    <button onClick={() => void load()} disabled={loading} className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50">
                        <RefreshCw size={15} className={loading ? "animate-spin" : ""} /> Làm mới
                    </button>
                </div>

                {loading ? (
                    <p className="py-12 text-center text-sm text-slate-500">Đang tải lớp giảng dạy...</p>
                ) : offerings.length === 0 ? (
                    <p className="px-5 py-12 text-center text-sm text-slate-500">Bạn chưa được phân công lớp môn học nào.</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[700px] text-left text-sm">
                            <thead className="bg-emerald-50 text-xs uppercase text-slate-600">
                                <tr><th className="p-4">Môn học</th><th className="p-4">Lớp hành chính</th><th className="p-4">Khoa</th><th className="p-4">Mã phân công</th><th className="p-4 text-right">Thao tác</th></tr>
                            </thead>
                            <tbody>
                                {offerings.map((offering) => (
                                    <tr key={offering.id} className="border-t border-slate-100">
                                        <td className="p-4"><p className="font-semibold text-slate-800">{offering.subject?.name || "—"}</p><p className="mt-1 text-xs text-slate-500">{offering.subject?.code || "Chưa có mã môn"}</p></td>
                                        <td className="p-4"><p className="font-medium text-slate-800">{offering.classroom?.name || "—"}</p><p className="mt-1 text-xs text-slate-500">{offering.classroom?.code || "—"}</p></td>
                                        <td className="p-4 text-slate-600">{offering.classroom?.faculty?.name || "—"}</td>
                                        <td className="p-4 font-mono text-xs text-emerald-700">{offering.code || `PHÂN-CÔNG-${offering.id}`}</td>
                                        <td className="p-4 text-right"><button onClick={() => void openOffering(offering)} className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"><Eye size={15} /> Xem lớp</button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </section>

            {detailLoading && <p className="rounded-xl bg-white py-8 text-center text-sm text-slate-500">Đang tải danh sách sinh viên...</p>}

            {detail && !detailLoading && (
                <section className="overflow-hidden rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-sm sm:p-6">
                    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">Chi tiết lớp giảng dạy</p>
                            <h2 className="mt-1 text-xl font-bold text-[#18352b]">{detail.offering.subject?.name} · {detail.offering.classroom?.name}</h2>
                            <p className="mt-1 text-sm text-slate-500">Mã lớp: {detail.offering.classroom?.code || "—"} · Giảng viên: {detail.offering.teacher?.fullName || "—"}</p>
                        </div>
                        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"><Users size={16} /> {detail.currentCount} sinh viên</div>
                    </div>
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full min-w-[560px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500"><tr><th className="p-3">Mã sinh viên</th><th className="p-3">Họ và tên</th><th className="p-3">Trạng thái</th></tr></thead>
                            <tbody>
                                {detail.students.map((student) => <tr key={student.id} className="border-t border-slate-100"><td className="p-3 font-mono text-emerald-700">{student.code}</td><td className="p-3 font-medium text-slate-800">{student.fullName}</td><td className="p-3 text-slate-600">{student.status || "—"}</td></tr>)}
                                {detail.students.length === 0 && <tr><td colSpan={3} className="p-8 text-center text-slate-500">Lớp hành chính hiện chưa có sinh viên.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}
        </div>
    );
}
