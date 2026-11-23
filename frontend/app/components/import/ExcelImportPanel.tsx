"use client";

import { useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, UploadCloud, AlertCircle } from "lucide-react";
import { btn, panel } from "../ui/shared";

type Preview = {
    total: number;
    valid: number;
    invalid: number;
    rows: { row: number; code: string; fullName: string; valid: boolean; errors: string[] }[];
};

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const auth = () => typeof window === "undefined" ? "" : sessionStorage.getItem("qlsv_auth") || "";

export function ExcelImportPanel({ onImported }: { onImported: (message: string) => void }) {
    const [file, setFile] = useState<File | null>(null);
    const [preview, setPreview] = useState<Preview | null>(null);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function send(path: string) {
        if (!file) throw new Error("Vui lòng chọn file Excel.");
        const form = new FormData();
        form.append("file", file);
        const response = await fetch(API + path, {
            method: "POST",
            headers: { Authorization: "Basic " + auth() },
            body: form,
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(body.message || body.detail || "Không thể xử lý file Excel.");
        return body;
    }

    async function checkFile() {
        setBusy(true); setError(""); setSuccess(""); setPreview(null);
        try { setPreview(await send("/api/admin/import/students/preview")); }
        catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    }

    async function confirmImport() {
        setBusy(true); setError(""); setSuccess("");
        try {
            const result = await send("/api/admin/import/students/confirm");
            setSuccess(result.message || "Nhập dữ liệu thành công.");
            setPreview(null); setFile(null);
            onImported(result.message || "Đã nhập dữ liệu sinh viên thành công.");
        } catch (e: any) { setError(e.message); }
        finally { setBusy(false); }
    }

    return (
        <div className="space-y-5">
            <section className={`${panel} p-6`}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <div className="mb-2 flex items-center gap-2 text-sm font-bold text-[#18352b]">
                            <FileSpreadsheet className="text-emerald-600" size={20} /> Import danh sách sinh viên
                        </div>
                        <p className="max-w-2xl text-sm leading-6 text-slate-500">
                            Tải file mẫu, điền thông tin sinh viên rồi tải lên để kiểm tra trước khi lưu vào Oracle.
                        </p>
                    </div>
                    <a href={API + "/api/admin/import/students/template"}
                        onClick={(e) => {
                            e.preventDefault();
                            fetch(API + "/api/admin/import/students/template", {
                                headers: { Authorization: "Basic " + auth() }
                            }).then(async r => {
                                if (!r.ok) throw new Error("Không tải được file mẫu.");
                                const blob = await r.blob();
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement("a");
                                link.href = url; link.download = "student-import-template.xlsx";
                                link.click(); URL.revokeObjectURL(url);
                            }).catch(err => setError(err.message));
                        }}
                        className={`${btn} border border-emerald-200 bg-emerald-50 text-emerald-700`}>
                        <Download size={16} /> Tải file Excel mẫu
                    </a>
                </div>
                <div className="mt-5 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/60 p-5">
                    <label className="flex cursor-pointer flex-col items-center gap-2 text-center">
                        <UploadCloud size={30} className="text-emerald-600" />
                        <span className="text-sm font-semibold text-slate-700">Chọn file Excel (.xlsx)</span>
                        <span className="text-xs text-slate-500">File cần giữ nguyên tên các cột trong mẫu.</span>
                        <input type="file" accept=".xlsx" className="mt-2 block max-w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-600 file:px-4 file:py-2 file:font-semibold file:text-white"
                            onChange={e => { setFile(e.target.files?.[0] || null); setPreview(null); setError(""); setSuccess(""); }} />
                    </label>
                    {file && <p className="mt-3 text-center text-xs font-medium text-emerald-700">{file.name}</p>}
                </div>
                <button disabled={!file || busy} onClick={checkFile} className={`${btn} gradient-button mt-4 text-white disabled:opacity-50`}>
                    {busy ? "Đang kiểm tra..." : "Kiểm tra dữ liệu"}
                </button>
            </section>

            {error && <div role="alert" className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700"><AlertCircle size={18} />{error}</div>}
            {success && <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700"><CheckCircle2 size={18} />{success}</div>}

            {preview && <section className={`${panel} p-6`}>
                <h3 className="font-bold text-[#18352b]">Kết quả kiểm tra file</h3>
                <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs text-slate-500">Tổng dòng</p><p className="mt-1 text-2xl font-bold text-slate-800">{preview.total}</p></div>
                    <div className="rounded-xl bg-emerald-50 p-3"><p className="text-xs text-emerald-700">Hợp lệ</p><p className="mt-1 text-2xl font-bold text-emerald-700">{preview.valid}</p></div>
                    <div className="rounded-xl bg-rose-50 p-3"><p className="text-xs text-rose-700">Có lỗi</p><p className="mt-1 text-2xl font-bold text-rose-700">{preview.invalid}</p></div>
                </div>
                <div className="mt-4 max-h-[360px] overflow-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                        <thead className="sticky top-0 bg-slate-50 text-xs text-slate-500"><tr><th className="p-3">Dòng</th><th className="p-3">Mã SV</th><th className="p-3">Họ tên</th><th className="p-3">Kết quả</th></tr></thead>
                        <tbody>{preview.rows.map(row => <tr key={row.row} className="border-t border-slate-100 align-top">
                            <td className="p-3">{row.row}</td><td className="p-3 font-medium">{row.code || "—"}</td><td className="p-3">{row.fullName || "—"}</td>
                            <td className="p-3">{row.valid ? <span className="text-emerald-700">Hợp lệ</span> : <span className="text-rose-700">{row.errors.join("; ")}</span>}</td>
                        </tr>)}</tbody>
                    </table>
                </div>
                <button disabled={busy || preview.invalid > 0 || preview.valid === 0} onClick={confirmImport} className={`${btn} gradient-button mt-5 text-white disabled:opacity-50`}>
                    {busy ? "Đang nhập..." : `Xác nhận nhập ${preview.valid} sinh viên`}
                </button>
                {preview.invalid > 0 && <p className="mt-2 text-xs text-rose-600">Hãy sửa các dòng lỗi trong Excel, chọn lại file và kiểm tra lại trước khi nhập.</p>}
            </section>}
        </div>
    );
}
