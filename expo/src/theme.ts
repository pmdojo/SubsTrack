import type { ViewStyle } from 'react-native'

export const colors = {
  bg: '#F4F3F0',
  bgSubtle: '#EDEBE6',
  card: '#FFFFFF',
  cardMuted: '#F7F6F4',
  ink: '#1A1917',
  inkSoft: '#3F3D3A',
  muted: '#8B887F',
  border: '#E9E6E0',
  soft: '#F7F6F4',

  primary: '#7B6EF6',
  primaryDark: '#5A4CE0',
  primarySoft: '#EAE8FE',
  primaryTint: '#F0EEFE',

  indigo: '#4F46E5',
  violet: '#8B5CF6',
  sky: '#38BDF8',

  success: '#0F9D58',
  successBg: '#E7F7EE',
  successDot: '#22C55E',
  danger: '#DC2626',
  dangerBg: '#FDECEC',
  warn: '#F59E0B',

  chip: '#EEECEA',
  chipInk: '#5A5854',
}

export const radius = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 28,
  xxxl: 34,
  pill: 999,
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
}

export const font = {
  regular: 'DMSans_400Regular',
  medium: 'DMSans_500Medium',
  semibold: 'DMSans_600SemiBold',
  bold: 'DMSans_700Bold',
}

// Elevation presets — pick one instead of hand-rolling shadow props.
export const elevation: Record<
  'flat' | 'card' | 'hero' | 'float' | 'sheet',
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
  hero: {
    shadowColor: '#4C1D95',
    shadowOpacity: 0.22,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 18 },
    elevation: 12,
  },
  float: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  sheet: {
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: -8 },
    elevation: 20,
  },
}
