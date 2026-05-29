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
    gradientFrom: '#F6F8F8',
    gradientTo: '#EEF3F2',
    canvasBg: '#F6F8F8',
    panelBg: 'rgba(255,255,255,0.85)',
    panelBgAlt: 'rgba(15,118,110,0.07)',
    border: 'rgba(15,23,42,0.10)',
    text: '#111827',
    textMuted: 'rgba(17,24,39,0.62)',
    primary: '#0F766E',
    secondary: '#B7791F',
    tertiary: '#334155',
    accent: 'rgba(15,118,110,0.11)',
    accentDeep: '#0F766E',
    connPill: '#DFF5F2',
    connBorder: 'rgba(15,118,110,0.22)',
    btnPrimary: '#0F766E',
    btnPrimaryText: '#FFFFFF',
    btnOutline: 'rgba(15,118,110,0.10)',
    btnOutlineText: '#0F766E',
    inputBg: 'rgba(255,255,255,0.90)',
    inputBorder: 'rgba(15,118,110,0.18)',
    inputText: '#111827',
    label: 'rgba(17,24,39,0.62)',
    ambientBg: 'rgba(15,118,110,0.08)',
    ambientBorder: 'rgba(15,118,110,0.20)',
    ambientText: '#0F766E',
  },
  evening: {
    gradientFrom: '#091312',
    gradientTo: '#101418',
    canvasBg: '#091312',
    panelBg: '#12191D',
    panelBgAlt: '#182326',
    border: 'rgba(226,232,240,0.08)',
    text: '#FFFFFF',
    textMuted: '#91A1A4',
    primary: '#22D3C5',
    secondary: '#F4B860',
    tertiary: '#8EA5B5',
    accent: 'rgba(34,211,197,0.12)',
    accentDeep: '#22D3C5',
    connPill: 'rgba(34,211,197,0.12)',
    connBorder: 'rgba(34,211,197,0.22)',
    btnPrimary: '#22D3C5',
    btnPrimaryText: '#051312',
    btnOutline: 'rgba(34,211,197,0.08)',
    btnOutlineText: '#22D3C5',
    inputBg: '#12191D',
    inputBorder: 'rgba(34,211,197,0.16)',
    inputText: '#FFFFFF',
    label: '#91A1A4',
    ambientBg: 'rgba(34,211,197,0.10)',
    ambientBorder: 'rgba(34,211,197,0.24)',
    ambientText: '#22D3C5',
  },
};
