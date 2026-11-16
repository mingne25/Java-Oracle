"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { Check, Sparkles, X } from "lucide-react";
import { type Field, type Item, btn, shortName, statusLabels } from "../ui/shared";

type EntityFormModalProps = {
    tab: string;
    title: string;
    editing: number | null;
    form: Item;
    setForm: Dispatch<SetStateAction<Item>>;
    account: Item;
    setAccount: Dispatch<SetStateAction<Item>>;
    lookup: Record<string, Item[]>;
    fields: Field[];
    busy: boolean;
    onClose: () => void;
    onSave: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
    onCreateAccount: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
};

export function EntityFormModal({ tab, title, editing, form, setForm, account, setAccount, lookup, fields, busy, onClose, onSave, onCreateAccount }: EntityFormModalProps) {
    return (
            <div
            className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#052e16]/45 p-4 backdrop-blur-md"
            onMouseDown={(e) => {
            if (e.target === e.currentTarget) onClose();
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
            onClick={() => onClose()}
            className="rounded-xl border border-emerald-900/10 p-2 text-slate-500 hover:text-white"
            >
            <X size={19} />
            </button>
            </div>
            <form
            onSubmit={tab === "accounts" ? onCreateAccount : onSave}
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
            fields.map(([key, label, type]) => (
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
            onClick={() => onClose()}
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
    );
}
