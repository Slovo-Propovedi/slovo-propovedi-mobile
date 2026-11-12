import { Fragment, type ReactElement } from 'react'
import { ScrollView, StyleSheet, Text } from 'react-native'
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
  value: string
  /** Page-owned wrapper around a single pill (e.g. An onboarding target). */
  wrapItem?: (item: PillTabItem, pill: ReactElement) => ReactElement
}

export const PillTabs = ({ items, onChange, onDisabledPress, value, wrapItem }: PillTabsProps) => {
  const { currentTheme } = useTheme()

  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.row}
      showsHorizontalScrollIndicator={false}
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
              styles.pill,
              {
                backgroundColor: isSelected ? withAlpha(currentTheme.primary, 0.16) : undefined,
                borderColor: isSelected ? currentTheme.primary : currentTheme.textMuted,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isDisabled
                    ? currentTheme.textMuted
                    : isSelected
                      ? currentTheme.primary
                      : currentTheme.text,
                },
              ]}
            >
              {item.label}
            </Text>
          </PressableButton>
        )

        return <Fragment key={item.key}>{wrapItem ? wrapItem(item, pill) : pill}</Fragment>
      })}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  label: { fontSize: FONT_SIZES.base },
  pill: {
    borderRadius: RADIUSES.round,
    borderWidth: 1,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  row: {
    gap: INDENTS.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
})
