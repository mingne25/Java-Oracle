"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Eye, EyeOff, GraduationCap, LockKeyhole, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { btn } from "../ui/shared";

export function Login({
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
