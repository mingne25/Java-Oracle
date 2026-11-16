import { statusLabels } from "./labels";

export type Item = Record<string, any>;
export { statusLabels };

export const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition duration-200";
export const panel = "glass rounded-[22px]";
export const shortName = (x: Item) => x.name || x.fullName || "—";
export function Initials({
    name,
    size = "md",
}: {
    name: string;
    size?: "sm" | "md" | "lg";
}) {
    return (
        <span
            className={`inline-flex shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/35 to-teal-500/25 font-bold text-emerald-100 ring-1 ring-emerald-300/20 ${size === "lg" ? "h-14 w-14 text-xl" : size === "sm" ? "h-9 w-9 text-xs" : "h-11 w-11 text-sm"}`}
        >
            {name
                .trim()
                .split(/\s+/)
                .slice(-2)
                .map((s) => s[0]?.toUpperCase())
                .join("") || "U"}
        </span>
    );
}
export function Status({ value }: { value: string }) {
    const good = value === "STUDYING" || value === "ACTIVE";
    const mid = value === "RESERVED" || value === "SUSPENDED";
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${good ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : mid ? "border-amber-500/20 bg-amber-500/10 text-amber-300" : "border-slate-500/25 bg-slate-500/10 text-slate-700"}`}
        >
            <span
                className={`h-1.5 w-1.5 rounded-full ${good ? "bg-emerald-400" : mid ? "bg-amber-400" : "bg-slate-400"}`}
            />
            {statusLabels[value] || value}
        </span>
    );
}
