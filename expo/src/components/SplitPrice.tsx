import React from 'react'
import { StyleProp, StyleSheet, Text, TextStyle, View } from 'react-native'
import { colors, font, typography } from '../theme'

type Size = 'sm' | 'md' | 'lg' | 'xl'

type Props = {
  /** Amount in the smallest UI unit — 274.84 or 649. */
  value: number
  /** Currency symbol to prefix. Defaults to '₹'. Use '$' etc. */
  currency?: string
  /** Trailing suffix — e.g. 'per month', '/ month'. Renders in a small tone. */
  suffix?: string
  /** How much cents to show when value has a decimal. */
  decimals?: number
  /** Visual size preset. Controls font sizes proportionally. */
  size?: Size
  /** Right-align by default; pass 'left' when embedded next to labels. */
  align?: 'left' | 'right'
  /** Override the whole/cents/suffix color. Defaults to ink. */
  color?: string
  /** Compact = drop the suffix line when there's no suffix; useful in tight rows. */
  containerStyle?: StyleProp<TextStyle>
}

/**
 * Currency amount with visual hierarchy — small currency symbol, big whole
 * part, small decimal aligned to the whole's cap-height, optional muted
 * suffix underneath. Matches DESIGN_SYSTEM.md §2 "numeric.split.*".
 *
 *   <SplitPrice value={274.84} currency="$" size="xl" />
 *   <SplitPrice value={649} suffix="per month" size="md" />
 */
export default function SplitPrice({
  value,
  currency = '₹',
  suffix,
  decimals,
  size = 'md',
  align = 'right',
  color = colors.ink,
  containerStyle,
}: Props) {
  const [whole, cents] = splitAmount(value, decimals)
  const scale = SIZE_MAP[size]

  return (
    <View style={[styles.wrap, align === 'left' && styles.wrapLeft, containerStyle]}>
      <View style={styles.row}>
        <Text
          style={[
            typography.numericSplitCents,
            { color, fontSize: scale.currency, lineHeight: scale.currency + 2 },
            styles.currency,
          ]}
        >
          {currency}
        </Text>
        <Text
          style={[
            typography.numericSplitWhole,
            { color, fontSize: scale.whole, lineHeight: scale.whole + 2 },
          ]}
        >
          {whole}
        </Text>
        {cents !== null ? (
          <Text
            style={[
              typography.numericSplitCents,
              {
                color,
                fontSize: scale.cents,
                lineHeight: scale.cents + 2,
                marginLeft: 2,
              },
            ]}
          >
            .{cents}
          </Text>
        ) : null}
      </View>
      {suffix ? (
        <Text
          style={[
            styles.suffix,
            { textAlign: align, fontSize: scale.suffix },
          ]}
        >
          {suffix}
        </Text>
      ) : null}
    </View>
  )
}

// ── Utilities ───────────────────────────────────────────────────────────────

/**
 * Splits a numeric amount into [whole, cents]. Returns cents = null when the
 * amount has no fractional part (so callers can skip rendering the ".00").
 *
 *   splitAmount(274.84)   → ['274', '84']
 *   splitAmount(649)      → ['649', null]
 *   splitAmount(1598.5)   → ['1,598', '50']
 *   splitAmount(1598, 2)  → ['1,598', '00']  (force decimals=2)
 */
export function splitAmount(
  value: number,
  decimals?: number
): [string, string | null] {
  const forced = decimals !== undefined
  const wholePart = Math.trunc(Math.abs(value))
  const fractionPart = Math.abs(value) - wholePart

  const wholeFormatted = formatWithGrouping(wholePart)
  const sign = value < 0 ? '-' : ''

  if (!forced && fractionPart === 0) {
    return [sign + wholeFormatted, null]
  }
  const d = decimals ?? 2
  const centsNum = Math.round(fractionPart * Math.pow(10, d))
  const centsStr = String(centsNum).padStart(d, '0')
  return [sign + wholeFormatted, centsStr]
}

/**
 * Groups digits with commas in the Indian numbering style (lakh/crore) when
 * the current process locale is en-IN; falls back to the JS engine's default
 * for everything else. Cheap enough to inline — no dep on Intl polyfills.
 */
function formatWithGrouping(n: number): string {
  try {
    return n.toLocaleString('en-IN')
  } catch {
    return String(n)
  }
}

// ── Sizing ──────────────────────────────────────────────────────────────────

const SIZE_MAP: Record<
  Size,
  { currency: number; whole: number; cents: number; suffix: number }
> = {
  sm: { currency: 12, whole: 18, cents: 12, suffix: 10 },
  md: { currency: 16, whole: 26, cents: 14, suffix: 11 },
  lg: { currency: 20, whole: 40, cents: 18, suffix: 12 },
  xl: { currency: 24, whole: 56, cents: 22, suffix: 13 },
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'flex-end',
  },
  wrapLeft: {
    alignItems: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  currency: {
    marginRight: 2,
    // Nudge symbol up so its cap-height aligns with the whole's cap-height.
    marginTop: 4,
  },
  suffix: {
    marginTop: 2,
    color: colors.muted,
    fontFamily: font.regular,
  },
})
