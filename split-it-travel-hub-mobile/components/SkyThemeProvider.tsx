import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolateColor,
} from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { useTimeTheme, type UseTimeThemeResult } from '@/hooks/useTimeTheme';
import { THEME, type ThemePhase } from '@/constants/theme';

// ── Context ──────────────────────────────────────────────────────────────────
const SkyThemeContext = createContext<UseTimeThemeResult | null>(null);

export function useSkyTheme() {
  const ctx = useContext(SkyThemeContext);
  if (!ctx) throw new Error('useSkyTheme must be used inside SkyThemeProvider');
  return ctx;
}

// ── Phase → numeric index for reanimated interpolation ───────────────────────
const PHASE_ORDER: ThemePhase[] = ['morning', 'evening'];
const phaseIndex = (p: ThemePhase) => PHASE_ORDER.indexOf(p);

// ── Provider ─────────────────────────────────────────────────────────────────
export function SkyThemeProvider({ children }: { children: ReactNode }) {
  const themeResult = useTimeTheme();
  const { phase } = themeResult;
  const progress = useSharedValue(phaseIndex(phase));

  useEffect(() => {
    progress.value = withTiming(phaseIndex(phase), {
      duration: 3000,
      easing: Easing.inOut(Easing.cubic),
    });
  }, [phase]);

  const phaseColors = PHASE_ORDER.map((p) => THEME[p].gradientFrom);

  const bgStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], phaseColors),
  }));

  return (
    <SkyThemeContext.Provider value={themeResult}>
      <Animated.View style={[StyleSheet.absoluteFill, bgStyle]} />
      <View style={StyleSheet.absoluteFill}>{children}</View>
    </SkyThemeContext.Provider>
  );
}
