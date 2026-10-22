import { useState, useEffect, useRef } from 'react';

interface UsePlayTimerProps {
  isActive: boolean;
  initialDuration?: number;
}

export function usePlayTimer({ isActive, initialDuration = 0 }: UsePlayTimerProps) {
  const [durationSeconds, setDurationSeconds] = useState<number>(initialDuration);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setDurationSeconds(d => d + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isActive]);

  return {
    durationSeconds,
    setDurationSeconds
  };
}
