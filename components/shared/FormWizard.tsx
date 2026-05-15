'use client'

import { useState, ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface WizardStep {
  id: string
  title: string
  icon?: ReactNode
  description?: string
}

interface FormWizardProps {
  steps: WizardStep[]
  children: (step: string) => ReactNode
  onComplete?: () => void
  onStepChange?: (step: string, index: number) => void
  completeLabel?: string
  /** Optional validation function — return true if current step is valid */
  canProceed?: (step: string) => boolean
}

export function FormWizard({
  steps,
  children,
  onComplete,
  onStepChange,
  completeLabel = 'Simpan',
  canProceed,
}: FormWizardProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(1) // 1 = forward, -1 = backward
  const currentStep = steps[currentIndex]

  const goTo = (index: number) => {
    if (index < 0 || index >= steps.length) return
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
    onStepChange?.(steps[index].id, index)
  }

  const next = () => {
    if (canProceed && !canProceed(currentStep.id)) return
    if (currentIndex < steps.length - 1) {
      goTo(currentIndex + 1)
    } else {
      onComplete?.()
    }
  }

  const prev = () => {
    if (currentIndex > 0) goTo(currentIndex - 1)
  }

  const progress = ((currentIndex + 1) / steps.length) * 100

  return (
    <div className="flex flex-col h-full">
      {/* Progress Bar */}
      <div className="flex-shrink-0 px-6 pt-6 pb-4">
        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-4">
          {steps.map((step, i) => (
            <button
              key={step.id}
              type="button"
              onClick={() => goTo(i)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all",
                i === currentIndex
                  ? "text-white bg-white/[0.06]"
                  : i < currentIndex
                    ? "text-emerald-400/60 cursor-pointer hover:bg-white/[0.03]"
                    : "text-white/20 hover:text-white/40 hover:bg-white/[0.02] cursor-pointer"
              )}
            >
              <div
                className={cn(
                  "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black transition-all",
                  i === currentIndex
                    ? "bg-violet-500/20 text-violet-400 border border-violet-500/30"
                    : i < currentIndex
                      ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                      : "bg-white/[0.04] text-white/20 border border-white/[0.06]"
                )}
              >
                {i < currentIndex ? <Check size={10} /> : i + 1}
              </div>
              <span className="hidden sm:inline">{step.title}</span>
            </button>
          ))}
        </div>

        {/* Progress bar */}
        <div className="h-1 rounded-full bg-white/[0.04] overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, var(--primary), var(--accent))' }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-y-auto custom-scroll">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep.id}
            custom={direction}
            initial={{ opacity: 0, x: direction * 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -30 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="px-6 pb-4"
          >
            {/* Step header */}
            <div className="mb-5">
              <h3 className="text-sm font-bold text-white/80">{currentStep.title}</h3>
              {currentStep.description && (
                <p className="text-[12px] text-white/30 mt-1">{currentStep.description}</p>
              )}
            </div>
            {children(currentStep.id)}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div
        className="flex-shrink-0 flex items-center justify-between px-6 py-4"
        style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
      >
        <button
          type="button"
          onClick={prev}
          disabled={currentIndex === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-bold text-white/40 hover:text-white/70 hover:bg-white/[0.04] disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={14} />
          Kembali
        </button>

        <span className="text-[10px] text-white/20 font-bold">
          {currentIndex + 1} / {steps.length}
        </span>

        <button
          type="button"
          onClick={next}
          className={cn(
            "flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold transition-all",
            currentIndex === steps.length - 1
              ? "text-white shadow-lg shadow-violet-500/25"
              : "text-white"
          )}
          style={{
            background: currentIndex === steps.length - 1
              ? 'linear-gradient(135deg, #7c3aed, #5b21b6)'
              : 'linear-gradient(135deg, var(--primary), var(--primary-active))',
            border: '1px solid rgba(139,92,246,0.3)',
          }}
        >
          {currentIndex === steps.length - 1 ? (
            <>
              <Check size={14} />
              {completeLabel}
            </>
          ) : (
            <>
              Lanjut
              <ChevronRight size={14} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}
