import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES, useTheme } from 'shared/ui/theme'

const IMPORT_LABEL = 'Импортировать'

/**
 * Кнопка запуска импорта: подпись с иконкой в обычном состоянии и спиннер во
 * время импорта.
 * @param props - Пропсы кнопки.
 * @param props.disabled - Импорт недоступен (не заполнен URL) или уже идёт.
 * @param props.onPress - Запускает импорт.
 * @param props.isImporting - Идёт импорт: спиннер и блокировка.
 */
export const ImportButton = ({
  disabled,
  isImporting,
  onPress,
}: {
  disabled: boolean
  isImporting: boolean
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <PressableButton
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={IMPORT_LABEL}
      accessibilityState={{ disabled }}
      style={[styles.button, { backgroundColor: currentTheme.primary }]}
    >
      {isImporting ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <View style={styles.buttonContent}>
          <Ionicons size={20} color={COLORS.white} name='download-outline' />
          <Text style={styles.buttonLabel}>{IMPORT_LABEL}</Text>
        </View>
      )}
    </PressableButton>
  )
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: RADIUSES.low,
    justifyContent: 'center',
    marginTop: INDENTS.low,
    minHeight: MIN_TOUCH_TARGET,
    paddingHorizontal: INDENTS.high,
  },
  buttonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
  },
  buttonLabel: {
    color: COLORS.white,
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
  },
})
