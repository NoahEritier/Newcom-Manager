import { useThemeMode } from '../hooks/useThemePreference';

// Guía de identidad visual Newcom Manager — ver documento de referencia.
// Ámbar (accent) es SOLO decorativo/large-text: nunca como color de texto de
// cuerpo ni en botones con texto chico (falla contraste AA en texto normal).

const lightColors = {
  background: '#FFFFFF',
  surface: '#F4F6F9',
  text: '#1A1A1A',
  textMuted: '#5C6570',
  primary: '#14315D',
  primaryText: '#FFFFFF',
  link: '#2C5AA0',
  accent: '#B8860B',
  success: '#1E6B3A',
  danger: '#B3261E',
  border: '#D8DCE2',
} as const;

const darkColors = {
  background: '#0D1B2E',
  surface: '#16273F',
  text: '#F4F6F9',
  textMuted: '#A9B4C2',
  primary: '#4C7FC7',
  primaryText: '#FFFFFF',
  link: '#7EA6E0',
  accent: '#D9A441',
  success: '#4ADE80',
  danger: '#F87171',
  border: '#2C3E58',
} as const;

export type ThemeColors = Record<keyof typeof lightColors, string>;

export function useTheme(): { colors: ThemeColors; isDark: boolean } {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  return { colors: isDark ? darkColors : lightColors, isDark };
}

// Fuente única en toda la app: Atkinson Hyperlegible (Braille Institute),
// diseñada para baja visión — formas muy distinguibles entre caracteres.
export const fonts = {
  regular: 'AtkinsonHyperlegible_400Regular',
  bold: 'AtkinsonHyperlegible_700Bold',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

// Escala tipográfica de la guía (16px mínimo de cuerpo, escala con fontScale del SO).
export const typography = {
  screenTitle: 24,
  sectionTitle: 20,
  body: 16,
  button: 16,
  caption: 14,
} as const;

// Área táctil mínima para todo elemento interactivo (48x48dp, estándar Android).
export const minTouchSize = 48;

export const radius = 8;
