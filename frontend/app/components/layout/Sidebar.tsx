"use client";

import { LogOut, Sparkles, X } from "lucide-react";
import type { Item } from "../ui/shared";

type SidebarProps = {
    sidebar: boolean;
    setSidebar: (open: boolean) => void;
    user: Item;
    tab: string;
    visibleTabs: string[];
    tabs: readonly (readonly [string, string])[];
    icons: Record<string, any>;
    navigate: (tab: string) => void;
    logout: () => void;
};

export function Sidebar({ sidebar, setSidebar, user, tab, visibleTabs, tabs, icons, navigate, logout }: SidebarProps) {
    return (
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
    );
}
