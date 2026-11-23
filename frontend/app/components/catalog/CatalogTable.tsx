"use client";

import type { Dispatch, SetStateAction } from "react";
import { AlertCircle, Edit3, Eye, RefreshCw, Search, Trash2, UserRoundPlus } from "lucide-react";
import { Initials, Status, panel, type Item, shortName } from "../ui/shared";

type CatalogTableProps = {
    tab: string;
    title: string;
    user: Item;
    listLoading: boolean;
    listError: string;
    filtered: Item[];
    query: string;
    setQuery: Dispatch<SetStateAction<string>>;
    onRefresh: () => void;
    visibleRows: Item[];
    edit: (item: Item) => void;
    remove: (id: number) => Promise<void>;
    studentPage: number;
    setStudentPage: Dispatch<SetStateAction<number>>;
    pageCount: number;
    studentPageSize: number;
    data: Item[];
    onViewStudents: (classroom: Item) => void;
    classOptions: Item[];
    classFilter: string;
    setClassFilter: Dispatch<SetStateAction<string>>;
};

export function CatalogTable({ tab, title, user, listLoading, listError, filtered, query, setQuery, onRefresh, visibleRows, edit, remove, studentPage, setStudentPage, pageCount, studentPageSize, data, onViewStudents, classOptions, classFilter, setClassFilter }: CatalogTableProps) {
    return (
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
                    {tab === "students" && user.role === "ADMIN" && (
                        <select
                            aria-label="Lọc sinh viên theo lớp"
                            className="soft-input w-[190px] py-2.5 text-xs"
                            value={classFilter}
                            onChange={(e) => { setStudentPage(0); setClassFilter(e.target.value); }}
                        >
                            <option value="ALL">Tất cả lớp</option>
                            <option value="UNASSIGNED">Chưa xếp lớp</option>
                            {classOptions.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}
                        </select>
                    )}
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
                        onClick={onRefresh}
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
                            {(user.role === "ADMIN" || tab === "classes") && (
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
                                {(user.role === "ADMIN" || tab === "classes") && (
                                    <td>
                                        <div className="flex justify-end gap-2">
                                            {tab === "classes" && (
                                                <button
                                                    title="Xem sinh viên trong lớp"
                                                    aria-label={`Xem sinh viên lớp ${shortName(x)}`}
                                                    onClick={() => onViewStudents(x)}
                                                    className="rounded-lg border border-emerald-900/10 p-2 text-emerald-600 hover:bg-emerald-50"
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            )}
                                            {user.role === "ADMIN" && (
                                                <>
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
                                                </>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {(listLoading || listError || filtered.length === 0) && (
                            <tr>
                                <td
                                    colSpan={
                                        user.role === "ADMIN" || tab === "classes"
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
                                ? "Hiển thị " + (filtered.length === 0 ? 0 : studentPage * studentPageSize + 1) + "–" + Math.min((studentPage + 1) * studentPageSize, filtered.length) + " / " + filtered.length + " sinh viên · Trang " + (studentPage + 1) + "/" + pageCount
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
    );
}
