"use client";

import { useEffect, useCallback } from "react";
import confetti from "canvas-confetti";

export default function ConfettiCelebration() {
  const fireConfetti = useCallback(() => {
    // Initial burst
    const count = 200;
    const defaults = { origin: { y: 0.7 }, zIndex: 9999 };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        particleCount: Math.floor(count * particleRatio),
        ...opts,
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55, colors: ["#D4A843", "#F5D98C", "#10B981"] });
    fire(0.2, { spread: 60, colors: ["#D4A843", "#ffffff", "#F5D98C"] });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8, colors: ["#10B981", "#D4A843", "#F5D98C"] });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2, colors: ["#D4A843", "#ffffff"] });
    fire(0.1, { spread: 120, startVelocity: 45, colors: ["#F5D98C", "#10B981", "#D4A843"] });

    // Second wave after 700ms
    setTimeout(() => {
      confetti({ particleCount: 80, spread: 100, origin: { x: 0.2, y: 0.6 }, colors: ["#D4A843", "#F5D98C", "#10B981"], zIndex: 9999 });
      confetti({ particleCount: 80, spread: 100, origin: { x: 0.8, y: 0.6 }, colors: ["#D4A843", "#F5D98C", "#10B981"], zIndex: 9999 });
    }, 700);
  }, []);

  useEffect(() => {
    const timer = setTimeout(fireConfetti, 500);
    return () => clearTimeout(timer);
  }, [fireConfetti]);

  return null;
}
