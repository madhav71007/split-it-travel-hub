export type ThemePhase = 'morning' | 'afternoon' | 'evening' | 'night';

export interface PhaseTheme {
  // Backgrounds (used with LinearGradient)
  gradientFrom: string;
  gradientTo: string;
  // Panels / cards
  panelBg: string;
  panelBgAlt: string;
  // Borders
  border: string;
  // Text
  text: string;
  textMuted: string;
  // Accents / interactive
  accent: string;
  accentDeep: string;
  // Tabs
  tabActive: string;
  tabInactive: string;
  // Connected / status
  connPill: string;
  connBorder: string;
  // Buttons
  btnPrimary: string;
  btnPrimaryText: string;
  // Input
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
    gradientFrom: '#F1F5F9',
    gradientTo: '#F0FDF4',
    panelBg: 'rgba(255,255,255,0.70)',
    panelBgAlt: 'rgba(240,253,244,0.50)',
    border: 'rgba(209,250,229,0.60)',
    text: '#1E293B',
    textMuted: 'rgba(30,41,59,0.60)',
    accent: '#D1FAE5',
    accentDeep: '#A7F3D0',
    tabActive: '#D1FAE5',
    tabInactive: 'rgba(30,41,59,0.40)',
    connPill: '#D1FAE5',
    connBorder: 'rgba(167,243,208,0.60)',
    btnPrimary: '#A7F3D0',
    btnPrimaryText: '#1E293B',
    inputBg: 'rgba(255,255,255,0.80)',
    inputBorder: '#D1FAE5',
    inputText: '#1E293B',
    label: 'rgba(30,41,59,0.60)',
    ambientBg: 'rgba(209,250,229,0.40)',
    ambientBorder: 'rgba(209,250,229,0.80)',
    ambientText: '#1E293B',
  },
  afternoon: {
    gradientFrom: '#F5F5F4',
    gradientTo: '#FAF9F6',
    panelBg: 'rgba(255,255,255,0.70)',
    panelBgAlt: 'rgba(250,249,246,0.50)',
    border: 'rgba(228,228,231,0.60)',
    text: '#1C1917',
    textMuted: 'rgba(28,25,23,0.60)',
    accent: '#E4E4E7',
    accentDeep: '#D4D4D8',
    tabActive: '#E4E4E7',
    tabInactive: 'rgba(28,25,23,0.40)',
    connPill: '#E4E4E7',
    connBorder: 'rgba(212,212,216,0.60)',
    btnPrimary: '#D4D4D8',
    btnPrimaryText: '#1C1917',
    inputBg: 'rgba(255,255,255,0.80)',
    inputBorder: '#E4E4E7',
    inputText: '#1C1917',
    label: 'rgba(28,25,23,0.60)',
    ambientBg: 'rgba(228,228,231,0.40)',
    ambientBorder: 'rgba(228,228,231,0.80)',
    ambientText: '#1C1917',
  },
  evening: {
    gradientFrom: '#1C1917',
    gradientTo: '#0F172A',
    panelBg: 'rgba(28,25,23,0.40)',
    panelBgAlt: 'rgba(28,25,23,0.25)',
    border: 'rgba(254,215,170,0.05)',
    text: '#E7E5E4',
    textMuted: 'rgba(231,229,228,0.60)',
    accent: 'rgba(124,45,18,0.40)',
    accentDeep: 'rgba(124,45,18,0.70)',
    tabActive: 'rgba(124,45,18,0.80)',
    tabInactive: 'rgba(231,229,228,0.40)',
    connPill: 'rgba(124,45,18,0.40)',
    connBorder: 'rgba(254,215,170,0.10)',
    btnPrimary: 'rgba(124,45,18,0.70)',
    btnPrimaryText: '#E7E5E4',
    inputBg: 'rgba(28,25,23,0.50)',
    inputBorder: 'rgba(254,215,170,0.10)',
    inputText: '#E7E5E4',
    label: 'rgba(231,229,228,0.60)',
    ambientBg: 'rgba(124,45,18,0.30)',
    ambientBorder: 'rgba(254,215,170,0.05)',
    ambientText: '#E7E5E4',
  },
  night: {
    gradientFrom: '#020617',
    gradientTo: '#09090B',
    panelBg: 'rgba(15,23,42,0.30)',
    panelBgAlt: 'rgba(15,23,42,0.20)',
    border: 'rgba(30,27,75,0.30)',
    text: '#CBD5E1',
    textMuted: 'rgba(203,213,225,0.60)',
    accent: 'rgba(30,27,75,0.30)',
    accentDeep: 'rgba(30,27,75,0.60)',
    tabActive: 'rgba(30,27,75,0.60)',
    tabInactive: 'rgba(203,213,225,0.40)',
    connPill: 'rgba(30,27,75,0.30)',
    connBorder: 'rgba(51,65,85,0.80)',
    btnPrimary: 'rgba(30,27,75,0.60)',
    btnPrimaryText: '#CBD5E1',
    inputBg: 'rgba(15,23,42,0.30)',
    inputBorder: 'rgba(51,65,85,0.80)',
    inputText: '#CBD5E1',
    label: 'rgba(203,213,225,0.60)',
    ambientBg: 'rgba(30,27,75,0.30)',
    ambientBorder: 'rgba(51,65,85,0.80)',
    ambientText: '#CBD5E1',
  },
} as const;
