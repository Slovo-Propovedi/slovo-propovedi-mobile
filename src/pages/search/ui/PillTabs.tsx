import { LinearGradient } from 'expo-linear-gradient'
import { Fragment, type ReactElement } from 'react'
import { ScrollView, View } from 'react-native'
import { COLORS, useTheme } from 'shared/ui/theme'
import { styles } from './PillTabs.styles'
import { PillTabSegment } from './PillTabSegment'

export interface PillTabItem {
  disabled?: boolean
  key: string
  label: string
}

interface PillTabsProps {
  items: PillTabItem[]
  onChange: (key: string) => void
  onDisabledPress?: () => void
  /** Scope only: full-width track with equal segments instead of a hugging one. */
  stretch?: boolean
  value: string
  /**
   * `scope` — card track with an external halo and gray selection.
   * `results` — trackless row of standalone labels; the selected item is an accent pill.
   */
  variant?: 'results' | 'scope'
  /** Page-owned wrapper around a single pill (e.g. An onboarding target). */
  wrapItem?: (item: PillTabItem, pill: ReactElement) => ReactElement
}

const SHADOW_COLORS = [
  'rgba(0, 0, 0, 0)',
  'rgba(0, 0, 0, 0.035)',
  'rgba(0, 0, 0, 0.02)',
  'rgba(0, 0, 0, 0)',
] as const
const SHADOW_LOCATIONS = [0, 0.35, 0.8, 1] as const

export const PillTabs = ({
  items,
  onChange,
  onDisabledPress,
  stretch = false,
  value,
  variant = 'scope',
  wrapItem,
}: PillTabsProps) => {
  const { isLight } = useTheme()
  const isResults = variant === 'results'
  const trackFill = isLight ? COLORS.white : COLORS.black

  const content = items.map(item => {
    const pill = (
      <PillTabSegment
        stretch={stretch}
        label={item.label}
        isResults={isResults}
        disabled={item.disabled}
        selected={item.key === value}
        onPress={item.disabled ? onDisabledPress : () => onChange(item.key)}
      />
    )

    return <Fragment key={item.key}>{wrapItem ? wrapItem(item, pill) : pill}</Fragment>
  })

  if (isResults)
    return (
      <ScrollView
        horizontal
        testID='pill-tabs-scroll'
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.resultsRow}
      >
        {content}
      </ScrollView>
    )

  const shadowedTrack = (
    <View>
      <LinearGradient
        colors={SHADOW_COLORS}
        testID='pill-tabs-shadow'
        style={styles.shadowHalo}
        locations={SHADOW_LOCATIONS}
      />
      <View
        testID='pill-tabs-track'
        style={[styles.track, { backgroundColor: trackFill }, stretch && styles.trackStretch]}
      >
        {content}
      </View>
    </View>
  )

  if (stretch)
    return (
      <View style={styles.scopeRow} testID='pill-tabs-stretch-row'>
        {shadowedTrack}
      </View>
    )

  return (
    <ScrollView
      horizontal
      testID='pill-tabs-scroll'
      style={styles.scopeScroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scopeScrollContent}
    >
      {shadowedTrack}
    </ScrollView>
  )
}
