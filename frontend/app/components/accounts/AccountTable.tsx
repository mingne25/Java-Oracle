"use client";

import { ShieldCheck } from "lucide-react";
import { roleLabels } from "../ui/labels";
import { Initials, Status, panel, type Item } from "../ui/shared";

export function AccountTable({ accounts }: { accounts: Item[] }) {
    return (
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
    );
}
