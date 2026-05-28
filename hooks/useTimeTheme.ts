import { useState, useEffect } from "react";

export type ThemePhase = "morning" | "afternoon" | "evening" | "night";

export function getThemePhaseForHour(hour: number): ThemePhase {
  if (hour >= 6 && hour < 11) {
    return "morning";
  } else if (hour >= 11 && hour < 16) {
    return "afternoon";
  } else if (hour >= 16 && hour < 19) {
    return "evening";
  } else {
    return "night";
  }
}

export function useTimeTheme() {
  const [phase, setPhase] = useState<ThemePhase>("night");
  const [manualPhase, setManualPhase] = useState<ThemePhase | null>(null);

  useEffect(() => {
    // Determine initial phase
    const hour = new Date().getHours();
    setPhase(getThemePhaseForHour(hour));

    // Update hourly
    const interval = setInterval(() => {
      if (manualPhase === null) {
        const currentHour = new Date().getHours();
        setPhase(getThemePhaseForHour(currentHour));
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [manualPhase]);

  const activePhase = manualPhase !== null ? manualPhase : phase;

  return {
    phase: activePhase,
    isManual: manualPhase !== null,
    setManualPhase,
    autoPhase: phase,
  };
}
