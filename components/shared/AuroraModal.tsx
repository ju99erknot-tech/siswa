"use client";

import { ReactNode } from "react";
import { AnimatePresence, motion as m } from "framer-motion";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "full";

const MODAL_SIZES: Record<ModalSize, string> = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[95vw] w-full",
};

export interface AuroraModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  icon?: ReactNode;
  children: ReactNode;
  maxWidth?: string;
  size?: ModalSize;
}

export function AuroraModal({
  open,
  onClose,
  title,
  icon,
  children,
  maxWidth,
  size,
}: AuroraModalProps) {
  const widthClass = size ? MODAL_SIZES[size] : maxWidth || "max-w-lg";
  return (
    <AnimatePresence>
      {open && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{
            background: "rgba(5,8,17,0.85)",
            backdropFilter: "blur(12px)",
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <m.div
            initial={{ scale: 0.93, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.93, opacity: 0, y: 16 }}
            transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "w-full rounded-2xl max-h-[90vh] overflow-y-auto custom-scroll",
              widthClass,
            )}
            style={{
              background: "#0d1221",
              border: "1px solid rgba(255,255,255,0.05)",
              boxShadow: "0 24px 64px rgba(0,0,0,0.7)",
            }}
          >
            <div
              className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
              style={{
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background: "#0d1221",
              }}
            >
              <h2 className="text-base font-bold text-white/90 flex items-center gap-2.5">
                {icon && <span className="text-violet-400">{icon}</span>}
                {title}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-white/35 hover:text-white/70 hover:bg-white/10 transition-all"
              >
                <X size={16} />
              </button>
            </div>
            <div className="p-6">{children}</div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
