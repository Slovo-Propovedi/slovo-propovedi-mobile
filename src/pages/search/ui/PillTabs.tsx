import { BlurView } from 'expo-blur'
import { Fragment, type ReactElement } from 'react'
import { ScrollView, View } from 'react-native'
import { GLASS } from 'shared/ui'
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
   * `scope` — card track with a blurred cast shadow and gray selection.
   * `results` — trackless row of standalone labels; the selected item is an accent pill.
   */
  variant?: 'results' | 'scope'
  /** Page-owned wrapper around a single pill (e.g. An onboarding target). */
  wrapItem?: (item: PillTabItem, pill: ReactElement) => ReactElement
}

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
        // The page is driven by the bottom search field, so the keyboard is up
        // while the user picks a category. The default 'never' would make this
        // ScrollView capture that first tap to dismiss the keyboard and swallow
        // the press; 'handled' lets the tapped pill fire.
        keyboardShouldPersistTaps='handled'
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.resultsRow}
      >
        {content}
      </ScrollView>
    )

  const shadowedTrack = (
    <View>
      <View style={styles.shadowBody} testID='pill-tabs-shadow-body' />
      <BlurView
        // Decorative feather layer with no blur target: selecting a dimezis
        // method would make expo-blur warn and fall back to `none` anyway.
        blurMethod='none'
        style={styles.shadowBlur}
        testID='pill-tabs-shadow-blur'
        intensity={GLASS.blur.intensity}
        tint={isLight ? 'light' : 'dark'}
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
