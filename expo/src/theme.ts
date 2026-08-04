// Design tokens — the sole source of visual truth.
// Every value here maps to docs/DESIGN_SYSTEM.md. Do NOT hard-code colors,
// spacings, radii, or shadows outside this file.

import type { TextStyle, ViewStyle } from 'react-native'

// ── Color ───────────────────────────────────────────────────────────────────

export const colors = {
  // App background gradient (top → mid → bottom)
  bgGradient: ['#FBF7F1', '#F4EFF7', '#EDE7F5'] as const,

  // Legacy flat bg (kept for components that don't need the gradient behind them)
  bg: '#F4F3F0',
  bgSubtle: '#EDEBE6',

  // Surfaces
  surface: '#FFFFFF',
  surfaceMuted: '#F4EFEA',
  card: '#FFFFFF',
  cardMuted: '#F7F6F4',
  soft: '#F7F6F4',

  // Text
  ink: '#1A1917',
  inkSoft: '#3F3D3A',
  muted: '#8B887F',

  // Structure
  border: '#EFEDE7',
  chip: '#EEECEA',
  chipInk: '#5A5854',

  // Primary (indigo per reference)
  primary: '#4C4CE5',
  primaryDark: '#3535D6',
  primarySoft: '#E8E4FE',
  primaryTint: '#EDE9FE',

  // Accent hues used in gradients / decorative
  indigo: '#4F46E5',
  violet: '#8B5CF6',
  sky: '#38BDF8',

  // Semantic
  success: '#0F9D58',
  successBg: '#DCF6E5',
  successDot: '#22C55E',
  warn: '#B45309',
  warnBg: '#FEF3C7',
  danger: '#DC2626',
  dangerBg: '#FDECEC',
  pause: '#F97316',
  neutral: '#57534E',
  neutralBg: '#EEEBE4',

  // Calendar dot colors (by category / card grouping)
  dot: {
    primary: '#4C4CE5',
    secondary: '#F97316',
    tertiary: '#22C55E',
  },
} as const

// ── Typography ──────────────────────────────────────────────────────────────

export const font = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
} as const

// Type scale — one const per named style so consumers can spread it directly:
//   <Text style={[typography.display.xl, { color: colors.ink }]}>
export const typography: Record<string, TextStyle> = {
  displayXL: {
    fontFamily: font.bold,
    fontSize: 56,
    lineHeight: 60,
    letterSpacing: -2,
  },
  displayMD: {
    fontFamily: font.bold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.2,
  },
  headingLG: {
    fontFamily: font.bold,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.6,
  },
  headingMD: {
    fontFamily: font.bold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
  titleMD: {
    fontFamily: font.bold,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  bodyMD: {
    fontFamily: font.medium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: -0.2,
  },
  bodySM: {
    fontFamily: font.regular,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: font.medium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.4,
  },
  micro: {
    fontFamily: font.bold,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 1,
  },
  numericSplitWhole: {
    fontFamily: font.bold,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -1.8,
  },
  numericSplitCents: {
    fontFamily: font.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: -0.4,
  },
}

// ── Spacing ─────────────────────────────────────────────────────────────────

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
  gutter: 24, // default screen horizontal padding
  section: 28, // between major sections
  cardInner: 20,
} as const

// ── Radius ──────────────────────────────────────────────────────────────────

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
  pill: 999,
} as const

// ── Elevation ───────────────────────────────────────────────────────────────

export const elevation: Record<
  'flat' | 'card' | 'tile' | 'hero' | 'float' | 'fab' | 'sheet',
  ViewStyle
> = {
  flat: {},
  card: {
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  tile: {
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  hero: {
    shadowColor: '#4C4CE5',
    shadowOpacity: 0.14,
    shadowRadius: 32,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  float: {
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  fab: {
    shadowColor: '#4C4CE5',
    shadowOpacity: 0.55,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 16,
  },
  sheet: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
  },
}

// ── Motion ──────────────────────────────────────────────────────────────────

export const motion = {
  fast: { type: 'timing' as const, duration: 150 },
  base: { type: 'timing' as const, duration: 220 },
  slow: { type: 'timing' as const, duration: 380 },
  springSoft: { type: 'spring' as const, damping: 18, stiffness: 260 },
  springFirm: { type: 'spring' as const, damping: 26, stiffness: 320 },
  orbitMs: 18000,
  counterMs: 900,
  rollMs: 900,
  rollStaggerMs: 60,
}

// ── Breakpoints ─────────────────────────────────────────────────────────────

export const breakpoints = {
  xs: 0,
  sm: 480,
  md: 768,
  lg: 1024,
} as const
