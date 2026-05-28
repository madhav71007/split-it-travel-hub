import { useState, useEffect, useCallback } from 'react';
import { type ThemePhase } from '@/constants/theme';

function detectPhase(hour: number): ThemePhase {
  // Day mode (6 AM to 6 PM)
  if (hour >= 6 && hour < 18) return 'morning';
  // Night mode (6 PM to 6 AM)
  return 'evening';
}

export interface UseTimeThemeResult {
  phase: ThemePhase;
  autoPhase: ThemePhase;
  isManual: boolean;
  setManualPhase: (p: ThemePhase | null) => void;
}

export function useTimeTheme(): UseTimeThemeResult {
  const [autoPhase, setAutoPhase] = useState<ThemePhase>(() =>
    detectPhase(new Date().getHours())
  );
  const [manualPhase, setManualPhaseState] = useState<ThemePhase | null>(null);

  // Refresh auto-phase every minute
  useEffect(() => {
    const tick = () => setAutoPhase(detectPhase(new Date().getHours()));
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  const setManualPhase = useCallback((p: ThemePhase | null) => {
    setManualPhaseState(p);
  }, []);

  return {
    phase: manualPhase ?? autoPhase,
    autoPhase,
    isManual: manualPhase !== null,
    setManualPhase,
  };
}
