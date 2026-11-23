"use client";

import { Building2, CheckCircle2, Hash, Mail, Phone, UserRound } from "lucide-react";
import { genderLabels, roleLabels, statusLabels } from "../ui/labels";
import { Initials, panel, type Item } from "../ui/shared";

type ProfilePanelProps = {
    profile: Item | null;
    user: Item;
    error: string;
};

export function ProfilePanel({ profile, user, error }: ProfilePanelProps) {
    return (

        <section className={`${panel} mx-auto w-full max-w-[980px] overflow-hidden rounded-[22px] border border-emerald-900/10 bg-white shadow-[0_18px_50px_rgba(13,87,52,.07)]`}>
            <div className="h-2 bg-gradient-to-r from-[#0f6b50] via-[#138a64] to-[#38b982]" />
            <div className="p-5 sm:p-8">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-4">
                        <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-[20px] bg-[#eaf7f1] ring-1 ring-[#d4eee0]">
                            <Initials name={profile?.fullName || user.username} size="lg" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-bold uppercase tracking-[.16em] text-[#138a64]">Hồ sơ cá nhân</p>
                            <h2 className="mt-1 break-words text-xl font-bold tracking-tight text-[#18352b] sm:text-2xl">
                                {profile?.fullName || user.username}
                            </h2>
                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-[#eaf7f1] px-3 py-1 text-[11px] font-semibold text-[#0f6b50]">
                                    {roleLabels[user.role]}
                                </span>
                                {profile?.code && (
                                    <span className="text-xs font-medium text-[#74867f]">{profile.code}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="inline-flex items-center gap-2 self-start rounded-full border border-[#d4eee0] bg-[#f4fbf7] px-3 py-2 text-[11px] font-medium text-[#247455] sm:self-center">
                        <span className={`h-2 w-2 rounded-full ${profile ? "bg-[#138a64]" : "animate-pulse bg-amber-400"}`} />
                        {profile ? "Hồ sơ đã đồng bộ" : error ? "Không tải được hồ sơ" : "Đang tải hồ sơ"}
                    </div>
                </div>

                <div className="my-6 h-px bg-[#e5eee9]" />

                <div className="mb-4">
                    <h3 className="text-sm font-bold text-[#18352b]">Thông tin chi tiết</h3>
                    <p className="mt-1 text-xs text-[#74867f]">Thông tin cá nhân và học vụ được đồng bộ từ hệ thống.</p>
                </div>

                {profile ? (
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {[
                            { label: "Mã định danh", value: profile.code, icon: Hash },
                            { label: "Email", value: profile.email, icon: Mail },
                            { label: "Số điện thoại", value: profile.phone, icon: Phone },
                            { label: "Giới tính", value: genderLabels[profile.gender] || profile.gender, icon: UserRound },
                            { label: "Trạng thái", value: statusLabels[profile.status] || profile.status, icon: CheckCircle2 },
                            { label: "Lớp / Khoa", value: profile.classroom?.name || profile.faculty?.name, icon: Building2 },
                        ]
                            .filter((item) => item.value != null && item.value !== "")
                            .map(({ label, value, icon: Icon }) => (
                                <div key={label} className="min-w-0 rounded-xl border border-[#e5eee9] bg-[#f8fcf9] p-4 transition hover:border-[#b7e2ce] hover:bg-[#f3faf6]">
                                    <div className="mb-3 flex items-center gap-2 text-[#138a64]">
                                        <Icon size={16} />
                                        <p className="text-[11px] font-medium text-[#74867f]">{label}</p>
                                    </div>
                                    <p className="break-words text-sm font-semibold text-[#18352b]">{String(value)}</p>
                                </div>
                            ))}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-[#cfe8d8] bg-[#f8fcf9] px-5 py-8 text-center">
                        <div className="mx-auto mb-3 grid h-10 w-10 place-items-center rounded-xl bg-[#eaf7f1] text-[#138a64]">
                            <UserRound size={20} />
                        </div>
                        <p className="text-sm font-semibold text-[#18352b]">Chưa tải được hồ sơ</p>
                        <p className="mt-1 text-xs text-[#74867f]">Vui lòng thử tải lại trang hoặc liên hệ quản trị viên nếu thông tin chưa được liên kết.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
