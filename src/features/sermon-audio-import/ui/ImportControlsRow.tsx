import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, StyleSheet, View } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'
import { type ImportSource } from '../lib/importTypes'
import { ImportSourceSelect } from './ImportSourceSelect'

const IMPORT_LABEL = 'Импортировать'

/**
 * Строка управления импортом: селектор источника/инстанса и кнопка запуска.
 * Пока импорт идёт, кнопка показывает спиннер вместо иконки скачивания.
 * @param props - Пропсы строки.
 * @param props.disabled - Запуск недоступен (пустая ссылка или импорт уже идёт).
 * @param props.instances - Прочие сохранённые инстансы с бэкенда.
 * @param props.invidiousBaseUrl - Сохранённый адрес инстанса Invidious.
 * @param props.isImporting - Импорт выполняется: кнопка заблокирована и со спиннером.
 * @param props.isWeb - На web YouTube в селекторе выключен.
 * @param props.onPressImport - Запускает импорт по ссылке из поля панели.
 * @param props.onSelectInstance - Выбор сохранённого инстанса Invidious.
 * @param props.onSelectYoutube - Выбор источника YouTube.
 * @param props.source - Сохранённый источник импорта.
 */
export const ImportControlsRow = ({
  disabled,
  instances,
  invidiousBaseUrl,
  isImporting,
  isWeb,
  onPressImport,
  onSelectInstance,
  onSelectYoutube,
  source,
}: {
  disabled: boolean
  instances: readonly string[]
  invidiousBaseUrl: string
  isImporting: boolean
  isWeb: boolean
  onPressImport: () => void
  onSelectInstance: (url: string) => void
  onSelectYoutube: () => void
  source: ImportSource
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.controlRow}>
      <ImportSourceSelect
        isWeb={isWeb}
        source={source}
        instances={instances}
        onSelectYoutube={onSelectYoutube}
        onSelectInstance={onSelectInstance}
        invidiousBaseUrl={invidiousBaseUrl}
      />
      <IconButton
        disabled={disabled}
        onPress={onPressImport}
        accessibilityLabel={IMPORT_LABEL}
        accessibilityState={{ disabled }}
        Icon={
          isImporting ? (
            <ActivityIndicator color={currentTheme.primary} />
          ) : (
            <Ionicons size={20} color={currentTheme.primary} name='cloud-download-outline' />
          )
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  controlRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: INDENTS.low,
    marginBottom: INDENTS.low,
  },
})
