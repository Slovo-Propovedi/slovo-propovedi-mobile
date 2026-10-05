import { StyleSheet, Text, View } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { COLORS, FONT_SIZES, INDENTS, RADIUSES, useTheme } from 'shared/ui/theme'
import { type ImportSource } from '../lib/importTypes'

const SOURCES: readonly ImportSource[] = ['youtube', 'invidious']

const SOURCE_LABELS: Record<ImportSource, string> = {
  invidious: 'Invidious',
  youtube: 'YouTube',
}

const DISABLED_SOURCE_HINT = 'На вебе доступен только источник Invidious'

/**
 * Переключатель источника импорта: два чипса, выбранный подсвечен основным
 * цветом темы (тем же приёмом, что у пресетов эквалайзера и подсказок формы).
 * Источник из `disabledSources` показан, но не нажимается: на web так скрыт
 * YouTube, недоступный без InnerTube.
 * @param props - Пропсы переключателя.
 * @param props.disabledSources - Источники, которые показаны, но не выбираются.
 * @param props.onSelect - Вызывается с новым источником.
 * @param props.source - Текущий источник импорта.
 */
export const ImportSourcePicker = ({
  disabledSources,
  onSelect,
  source,
}: {
  disabledSources?: readonly ImportSource[]
  onSelect: (source: ImportSource) => void
  source: ImportSource
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.row}>
      {SOURCES.map(option => {
        const isSelected = option === source
        const isDisabled = disabledSources?.includes(option) ?? false

        return (
          <PressableButton
            key={option}
            disabled={isDisabled}
            onPress={() => onSelect(option)}
            accessibilityHint={isDisabled ? DISABLED_SOURCE_HINT : undefined}
            accessibilityState={{ disabled: isDisabled, selected: isSelected }}
            style={[
              styles.chip,
              {
                backgroundColor: isSelected ? currentTheme.primary : currentTheme.surface,
                borderColor: isSelected ? currentTheme.primary : currentTheme.textMuted,
              },
            ]}
          >
            <Text
              style={[
                styles.chipText,
                {
                  color: isSelected
                    ? COLORS.white
                    : isDisabled
                      ? currentTheme.textMuted
                      : currentTheme.text,
                },
              ]}
            >
              {SOURCE_LABELS[option]}
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
    paddingHorizontal: INDENTS.high,
    paddingVertical: INDENTS.low,
  },
  chipText: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    gap: INDENTS.low,
    marginBottom: INDENTS.low,
  },
})
