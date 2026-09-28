import { StyleSheet, Text, View } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { EQ_PRESETS, type EqualizerPreset } from './eqPresets'

const PRESET_LABEL_PREFIX = 'Пресет'

interface EqPresetChipsProps {
  activePresetId: null | string
  onSelect: (preset: EqualizerPreset) => void
}

export const EqPresetChips = ({ activePresetId, onSelect }: EqPresetChipsProps) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.row}>
      {EQ_PRESETS.map(preset => {
        const isActive = preset.id === activePresetId

        return (
          <PressableButton
            key={preset.id}
            onPress={() => onSelect(preset)}
            accessibilityLabel={`${PRESET_LABEL_PREFIX} ${preset.label}`}
            accessibilityState={isActive ? { selected: true } : undefined}
            style={[
              styles.chip,
              { borderColor: isActive ? currentTheme.primary : currentTheme.textMuted },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                { color: isActive ? currentTheme.primary : currentTheme.text },
              ]}
            >
              {preset.label}
            </Text>
          </PressableButton>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    borderRadius: RADIUSES.round,
    borderWidth: 1,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  chipText: { fontSize: FONT_SIZES.base },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: INDENTS.low,
    marginBottom: INDENTS.medium,
  },
})
