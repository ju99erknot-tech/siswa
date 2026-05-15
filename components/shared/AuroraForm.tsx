"use client";

import { ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { Search } from "lucide-react";

export interface SearchBarProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  right?: ReactNode;
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Cari...",
  right,
}: SearchBarProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25 pointer-events-none" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full h-10 pl-10 pr-4 rounded-xl text-sm outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.04)",
            color: "rgba(255,255,255,0.80)",
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = "rgba(139,92,246,0.40)";
            e.currentTarget.style.background = "rgba(139,92,246,0.05)";
            e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.10)";
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.boxShadow = "none";
          }}
        />
      </div>
      {right}
    </div>
  );
}

export interface AuroraInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function AuroraInput({
  label,
  error,
  hint,
  className,
  onFocus: propOnFocus,
  onBlur: propOnBlur,
  ...rest
}: AuroraInputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
          {label}
        </label>
      )}
      <input
        {...rest}
        className={cn(
          "w-full h-11 px-4 rounded-xl text-sm outline-none transition-all",
          className,
        )}
        style={{
          background: "rgba(255,255,255,0.04)",
          border: `1px solid ${error ? "rgba(244,63,94,0.50)" : "rgba(255,255,255,0.07)"}`,
          color: "rgba(255,255,255,0.85)",
          ...rest.style,
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = "rgba(139,92,246,0.45)";
          e.currentTarget.style.background = "rgba(139,92,246,0.06)";
          e.currentTarget.style.boxShadow = "0 0 0 3px rgba(139,92,246,0.12)";
          propOnFocus?.(e);
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = error
            ? "rgba(244,63,94,0.50)"
            : "rgba(255,255,255,0.07)";
          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
          e.currentTarget.style.boxShadow = "none";
          propOnBlur?.(e);
        }}
      />
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
      {hint && !error && <p className="text-[11px] text-white/25">{hint}</p>}
    </div>
  );
}

export interface AuroraSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export function AuroraSelect({
  label,
  error,
  hint,
  children,
  className,
  onFocus: propOnFocus,
  onBlur: propOnBlur,
  ...rest
}: AuroraSelectProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="text-[10px] font-bold text-white/35 uppercase tracking-[0.15em]">
          {label}
        </label>
      )}
      <select
        {...rest}
        className={cn(
          "w-full h-11 px-4 rounded-xl text-sm outline-none appearance-none transition-all",
          className,
        )}
        style={{
          background: focused
            ? "rgba(139,92,246,0.06)"
            : "rgba(255,255,255,0.04)",
          border: `1px solid ${error ? "rgba(244,63,94,0.50)" : focused ? "rgba(139,92,246,0.45)" : "rgba(255,255,255,0.07)"}`,
          color: "rgba(255,255,255,0.80)",
          boxShadow: focused ? "0 0 0 3px rgba(139,92,246,0.12)" : "none",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath d='M2.5 4.5L6 8L9.5 4.5' stroke='rgba(255,255,255,0.35)' stroke-width='1.5' stroke-linecap='round'/%3E%3C/svg%3E\")",
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 12px center",
          paddingRight: "36px",
        }}
        onFocus={(e) => {
          setFocused(true);
          propOnFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          propOnBlur?.(e);
        }}
      >
        {children}
      </select>
      {error && <p className="text-[11px] text-rose-400">{error}</p>}
      {hint && !error && <p className="text-[11px] text-white/25">{hint}</p>}
    </div>
  );
}
