"use client";

import { LucideIcon } from "lucide-react";

interface UtilityHeaderProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  accentColor?: "violet" | "cyan" | "amber" | "emerald" | "rose" | "indigo";
  actionLabel?: string;
  actionIcon?: LucideIcon;
  onAction?: () => void;
  actionDisabled?: boolean;
}

const ACCENT: Record<
  string,
  {
    gradient: string;
    glow: string;
    border: string;
    btnBg: string;
    btnColor: string;
    btnGlow: string;
  }
> = {
  violet: {
    gradient: "linear-gradient(135deg, #1a0533 0%, #0c0820 50%, #050d1e 100%)",
    glow: "rgba(139,92,246,0.35)",
    border: "rgba(139,92,246,0.20)",
    btnBg: "linear-gradient(135deg, #8b5cf6, #6d28d9)",
    btnColor: "#fff",
    btnGlow: "rgba(139,92,246,0.40)",
  },
  cyan: {
    gradient: "linear-gradient(135deg, #001a1a 0%, #0a1520 50%, #050d1e 100%)",
    glow: "rgba(6,182,212,0.30)",
    border: "rgba(6,182,212,0.20)",
    btnBg: "linear-gradient(135deg, #06b6d4, #0284c7)",
    btnColor: "#fff",
    btnGlow: "rgba(6,182,212,0.40)",
  },
  amber: {
    gradient: "linear-gradient(135deg, #1a1000 0%, #0c0820 50%, #050d1e 100%)",
    glow: "rgba(245,158,11,0.28)",
    border: "rgba(245,158,11,0.18)",
    btnBg: "linear-gradient(135deg, #f59e0b, #d97706)",
    btnColor: "#000",
    btnGlow: "rgba(245,158,11,0.40)",
  },
  emerald: {
    gradient: "linear-gradient(135deg, #001a0a 0%, #0a1a0f 50%, #050d1e 100%)",
    glow: "rgba(52,211,153,0.28)",
    border: "rgba(52,211,153,0.18)",
    btnBg: "linear-gradient(135deg, #10b981, #059669)",
    btnColor: "#fff",
    btnGlow: "rgba(52,211,153,0.35)",
  },
  rose: {
    gradient: "linear-gradient(135deg, #1a0008 0%, #0c0820 50%, #050d1e 100%)",
    glow: "rgba(244,63,94,0.28)",
    border: "rgba(244,63,94,0.18)",
    btnBg: "linear-gradient(135deg, #f43f5e, #e11d48)",
    btnColor: "#fff",
    btnGlow: "rgba(244,63,94,0.35)",
  },
  indigo: {
    gradient: "linear-gradient(135deg, #0a0a2a 0%, #0c0820 50%, #050d1e 100%)",
    glow: "rgba(99,102,241,0.28)",
    border: "rgba(99,102,241,0.18)",
    btnBg: "linear-gradient(135deg, #6366f1, #4f46e5)",
    btnColor: "#fff",
    btnGlow: "rgba(99,102,241,0.35)",
  },
};

export default function UtilityHeader({
  icon: Icon,
  title,
  subtitle,
  accentColor = "violet",
  actionLabel,
  actionIcon: ActionIcon,
  onAction,
  actionDisabled = false,
}: UtilityHeaderProps) {
  const a = ACCENT[accentColor] || ACCENT.violet;

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-6 sm:p-7"
      style={{ background: a.gradient, border: `1px solid ${a.border}` }}
    >
      {/* Glow orb */}
      <div
        className="absolute -top-16 -right-16 w-56 h-56 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle, ${a.glow} 0%, transparent 70%)`,
          filter: "blur(50px)",
        }}
      />
      {/* Dot grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(139,92,246,0.15) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-4">
          <div
            className="w-[52px] h-[52px] rounded-xl flex items-center justify-center flex-shrink-0"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Icon className="w-6 h-6 text-white/90" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight leading-tight">
              {title}
            </h1>
            <p className="text-[11px] font-bold text-white/45 uppercase tracking-[0.15em] mt-0.5">
              {subtitle}
            </p>
          </div>
        </div>

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            disabled={actionDisabled}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
            style={{
              background: a.btnBg,
              color: a.btnColor,
              boxShadow: `0 4px 20px ${a.btnGlow}`,
            }}
          >
            {ActionIcon && <ActionIcon className="w-4 h-4" />}
            {actionLabel}
          </button>
        )}
      </div>
    </div>
  );
}
