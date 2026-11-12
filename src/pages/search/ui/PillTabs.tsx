import { Fragment, type ReactElement } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme, withAlpha } from 'shared/ui/theme'

export interface PillTabItem {
  disabled?: boolean
  key: string
  label: string
}

interface PillTabsProps {
  items: PillTabItem[]
  onChange: (key: string) => void
  onDisabledPress?: () => void
  /** Full-width track with equal segments (scope row) instead of a hugging, scrollable one. */
  stretch?: boolean
  value: string
  /** Page-owned wrapper around a single pill (e.g. An onboarding target). */
  wrapItem?: (item: PillTabItem, pill: ReactElement) => ReactElement
}

const TRACK_HEIGHT = 48
const TRACK_PADDING = 3

export const PillTabs = ({
  items,
  onChange,
  onDisabledPress,
  stretch = false,
  value,
  wrapItem,
}: PillTabsProps) => {
  const { currentTheme } = useTheme()

  const track = (
    <View
      testID='pill-tabs-track'
      style={[styles.track, { backgroundColor: currentTheme.card }, stretch && styles.trackStretch]}
    >
      {items.map(item => {
        const isSelected = item.key === value
        const isDisabled = item.disabled === true

        const pill = (
          <PressableButton
            accessibilityLabel={item.label}
            onPress={isDisabled ? onDisabledPress : () => onChange(item.key)}
            accessibilityState={{ disabled: isDisabled, selected: isSelected }}
            style={[
              styles.segment,
              stretch && styles.segmentStretch,
              isSelected && { backgroundColor: withAlpha(currentTheme.text, 0.1) },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isDisabled ? currentTheme.textMuted : currentTheme.text,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
            >
              {item.label}
            </Text>
          </PressableButton>
        )

        return <Fragment key={item.key}>{wrapItem ? wrapItem(item, pill) : pill}</Fragment>
      })}
    </View>
  )

  if (stretch) return <View style={styles.stretchRow}>{track}</View>

  return (
    <ScrollView
      horizontal
      style={styles.scroll}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {track}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZES.base },
  scroll: { flexGrow: 0 },
  scrollContent: {
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.lowest,
  },
  segment: {
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: RADIUSES.round,
    height: '100%',
    justifyContent: 'center',
    paddingHorizontal: INDENTS.middle,
  },
  segmentStretch: { flex: 1, paddingHorizontal: 0 },
  stretchRow: {
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.lowest,
  },
  track: {
    borderRadius: RADIUSES.round,
    // Deep downward-only drop shadow: a third of the 48dp track height, with a
    // wide blur so the track reads as lifted, not outlined.
    boxShadow: '0px 16px 38px rgba(0, 0, 0, 0.06)',
    // Android elevation cannot offset or blur like boxShadow; 3 is the closest
    // modest approximation.
    elevation: 3,
    flexDirection: 'row',
    height: TRACK_HEIGHT,
    padding: TRACK_PADDING,
  },
  trackStretch: { flexGrow: 1 },
})
