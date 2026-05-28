export type ThemePhase = 'morning' | 'evening';

export interface PhaseTheme {
  // Backgrounds
  gradientFrom: string;
  gradientTo: string;
  // Canvas & Panels
  canvasBg: string;
  panelBg: string;
  panelBgAlt: string;
  // Borders
  border: string;
  // Text
  text: string;
  textMuted: string;
  // Brand Accents
  primary: string;      // Purple/Indigo from design system (#9D85FF)
  secondary: string;    // Peach/Orange from design system (#FF9F8E)
  tertiary: string;     // Blue/Slate from design system (#4A6FA5)
  accent: string;       // Backward compatibility
  accentDeep: string;   // Backward compatibility
  // Statuses
  connPill: string;
  connBorder: string;
  // Buttons
  btnPrimary: string;
  btnPrimaryText: string;
  btnOutline: string;
  btnOutlineText: string;
  // Inputs
  inputBg: string;
  inputBorder: string;
  inputText: string;
  // Labels
  label: string;
  // Ambient pill
  ambientBg: string;
  ambientBorder: string;
  ambientText: string;
}

export const THEME: Record<ThemePhase, PhaseTheme> = {
  morning: {
    gradientFrom: '#F7F6FC',
    gradientTo: '#F0EFFB',
    canvasBg: '#F7F6FC',
    panelBg: 'rgba(255,255,255,0.85)',
    panelBgAlt: 'rgba(157,133,255,0.06)',
    border: 'rgba(157,133,255,0.12)',
    text: '#12121A',
    textMuted: 'rgba(18,18,26,0.60)',
    primary: '#7C5CFC',
    secondary: '#E06553',
    tertiary: '#3B5998',
    accent: 'rgba(124,92,252,0.10)',
    accentDeep: '#7C5CFC',
    connPill: '#EBE9FE',
    connBorder: 'rgba(124,92,252,0.20)',
    btnPrimary: '#7C5CFC',
    btnPrimaryText: '#FFFFFF',
    btnOutline: 'rgba(124,92,252,0.10)',
    btnOutlineText: '#7C5CFC',
    inputBg: 'rgba(255,255,255,0.90)',
    inputBorder: 'rgba(124,92,252,0.20)',
    inputText: '#12121A',
    label: 'rgba(18,18,26,0.60)',
    ambientBg: 'rgba(124,92,252,0.08)',
    ambientBorder: 'rgba(124,92,252,0.20)',
    ambientText: '#7C5CFC',
  },
  evening: {
    gradientFrom: '#0F0E17',
    gradientTo: '#0E0D14',
    canvasBg: '#0E0E14',
    panelBg: '#171520',
    panelBgAlt: '#1E1B29',
    border: 'rgba(157,133,255,0.08)',
    text: '#FFFFFF',
    textMuted: '#8C8A9A',
    primary: '#9D85FF',
    secondary: '#FF9F8E',
    tertiary: '#4A6FA5',
    accent: 'rgba(157,133,255,0.12)',
    accentDeep: '#9D85FF',
    connPill: 'rgba(157,133,255,0.12)',
    connBorder: 'rgba(157,133,255,0.20)',
    btnPrimary: '#9D85FF',
    btnPrimaryText: '#12121A',
    btnOutline: 'rgba(157,133,255,0.06)',
    btnOutlineText: '#9D85FF',
    inputBg: '#171520',
    inputBorder: 'rgba(157,133,255,0.15)',
    inputText: '#FFFFFF',
    label: '#8C8A9A',
    ambientBg: 'rgba(157,133,255,0.10)',
    ambientBorder: 'rgba(157,133,255,0.25)',
    ambientText: '#9D85FF',
  },
};
