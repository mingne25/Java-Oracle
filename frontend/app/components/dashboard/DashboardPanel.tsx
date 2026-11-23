"use client";

import type { Dispatch, SetStateAction } from "react";
import { Plus } from "lucide-react";
import { Initials, type Item, statusLabels } from "../ui/shared";

type DashboardCard = { label: string; value: string | number; icon: any };
type DashboardPanelProps = {
    user: Item;
    cards: DashboardCard[];
    actions: string[];
    classDistribution: [string, number][];
    lookup: Record<string, Item[]>;
    icons: Record<string, any>;
    tabs: readonly (readonly [string, string])[];
    navigate: (tab: string) => void;
    setForm: Dispatch<SetStateAction<Item>>;
    setEditing: Dispatch<SetStateAction<number | null>>;
    setTab: Dispatch<SetStateAction<string>>;
    setModal: Dispatch<SetStateAction<boolean>>;
};

export function DashboardPanel({ user, cards, actions, classDistribution, lookup, icons, tabs, navigate, setForm, setEditing, setTab, setModal }: DashboardPanelProps) {
    return (
        <div className="space-y-5">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {cards.map(({ label, value, icon: Icon }) => (
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
                        {actions.map((action) => {
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
    );
}
