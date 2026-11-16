"use client";

import { ChevronDown, Menu, Search, Wifi } from "lucide-react";
import { roleLabels } from "../ui/labels";
import { Initials, type Item } from "../ui/shared";

type TopbarProps = {
    setSidebar: (open: boolean) => void;
    user: Item;
    title: string;
    navigate: (tab: string) => void;
};

export function Topbar({ setSidebar, user, title, navigate }: TopbarProps) {
    return (
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
    );
}
