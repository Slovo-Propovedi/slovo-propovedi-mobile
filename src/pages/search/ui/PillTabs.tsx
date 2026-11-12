import { Fragment, type ReactElement } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { useTheme, withAlpha } from 'shared/ui/theme'
import { styles } from './PillTabs.styles'

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
  /** `scope` — white track with a soft external shadow; `results` — flat track, accent selection. */
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
  const { currentTheme } = useTheme()
  const isResults = variant === 'results'

  const track = (
    <View
      testID='pill-tabs-track'
      style={[
        styles.track,
        { backgroundColor: currentTheme.card },
        !isResults && styles.trackShadow,
        stretch && styles.trackStretch,
      ]}
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
              isSelected && {
                backgroundColor: isResults
                  ? currentTheme.primary
                  : withAlpha(currentTheme.text, 0.1),
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isDisabled
                    ? currentTheme.textMuted
                    : isResults && isSelected
                      ? currentTheme.onPrimary
                      : currentTheme.text,
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

  if (stretch)
    return (
      <View
        testID='pill-tabs-stretch-row'
        style={isResults ? styles.stretchRowCompact : styles.stretchRowRoom}
      >
        {track}
      </View>
    )

  return (
    <ScrollView
      horizontal
      testID='pill-tabs-scroll'
      showsHorizontalScrollIndicator={false}
      style={isResults ? styles.scrollCompact : styles.scrollRoom}
      contentContainerStyle={isResults ? styles.scrollContentCompact : styles.scrollContentRoom}
    >
      {track}
    </ScrollView>
  )
}
