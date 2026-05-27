import { useState, useEffect, useCallback } from 'react';
import { type ThemePhase } from '@/constants/theme';

function detectPhase(hour: number): ThemePhase {
  if (hour >= 6 && hour < 11) return 'morning';
  if (hour >= 11 && hour < 16) return 'afternoon';
  if (hour >= 16 && hour < 19) return 'evening';
  return 'night';
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
