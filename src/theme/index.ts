// Paleta sobria y de alto contraste — pensada para entrenadores de 40-80 años.
// No hardcodear tamaños que ignoren el accessibility scaling del SO: los tamaños
// de acá son la base de `fontSize` en RN, que ya escala con la config del sistema
// salvo que se pase `allowFontScaling={false}` (no usar esa prop en este proyecto).

export const colors = {
  background: '#FFFFFF',
  surface: '#F4F6F8',
  text: '#1A1A1A',
  textMuted: '#4B5563',
  primary: '#1E5AA8',
  primaryText: '#FFFFFF',
  success: '#2E7D32',
  danger: '#B3261E',
  border: '#D1D5DB',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const typography = {
  body: 17,
  label: 15,
  title: 22,
  heading: 28,
} as const;

// Área táctil mínima para todo elemento interactivo (botones, toggles, filas de lista).
export const minTouchSize = 48;
