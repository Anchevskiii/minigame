import confetti from 'canvas-confetti';

/**
 * Triggers dopamine burst celebration with confetti cannons
 */
export function triggerVictoryConfetti(): void {
  try {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });

    setTimeout(() => {
      confetti({
        particleCount: 60,
        angle: 60,
        spread: 55,
        origin: { x: 0 }
      });
      confetti({
        particleCount: 60,
        angle: 120,
        spread: 55,
        origin: { x: 1 }
      });
    }, 300);
  } catch {
    // Graceful fallback if confetti cannot run
  }
}
