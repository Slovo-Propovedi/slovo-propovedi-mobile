import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native'
import { PressableButton } from 'shared/ui/pressable-button'
import { COLORS, FONT_SIZES, INDENTS, MIN_TOUCH_TARGET, RADIUSES, useTheme } from 'shared/ui/theme'
import { useImportSettings } from '../lib/importSettings'
import { type ImportedSermonData, type ImportPhase } from '../lib/importTypes'
import { useAudioImport } from '../lib/useAudioImport'
import { ImportInstanceField } from './ImportInstanceField'
import { ImportSourcePicker } from './ImportSourcePicker'

const IMPORT_LABEL = 'Импортировать'
const IMPORT_HINT =
  'Скачивает аудиодорожку с YouTube и подставляет её вместе с названием и описанием.'

const _SEARCHING_LABEL = 'Поиск видео…'

const PHASE_LABELS: Record<ImportPhase, string> = {
  download: 'Скачивание…',
  upload: 'Загрузка на сервер…',
}

/**
 * Блок импорта проповеди из YouTube/Invidious под полем «YouTube (URL)»: выбор
 * источника, адрес инстанса Invidious, кнопка импорта с прогрессом по фазам.
 * Поддерживается только на native (в вебе источники недоступны).
 * @param props - Пропсы блока импорта.
 * @param props.disabled - Импорт невозможен (например, не заполнен URL).
 * @param props.onImported - Получает аудио URL, заголовок и описание для формы.
 * @param props.youtubeUrl - Ссылка или ID видео из поля формы.
 */
export const ImportFromYoutube = ({
  disabled,
  onImported,
  youtubeUrl,
}: {
  disabled: boolean
  onImported: (data: ImportedSermonData) => void
  youtubeUrl: string
}) => {
  const { currentTheme } = useTheme()
  const { settings, updateSettings } = useImportSettings()
  const { isImporting, progress, startImport } = useAudioImport({
    onImported,
    settings,
    url: youtubeUrl,
  })

  const handlePress = () => void startImport()

  // Пока первый отчёт источника не пришёл, фаза неизвестна — показываем поиск видео,
  // чтобы админ не смотрел на «Скачивание… 0%» во время запроса метаданных.

  if (Platform.OS === 'web') return null

  const isDisabled = disabled || isImporting

  return (
    <View style={styles.block}>
      <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{IMPORT_HINT}</Text>
      <ImportSourcePicker
        source={settings.source}
        onSelect={source => updateSettings({ source })}
      />
      {settings.source === 'invidious' ? (
        <ImportInstanceField
          invidiousBaseUrl={settings.invidiousBaseUrl}
          onChange={invidiousBaseUrl => updateSettings({ invidiousBaseUrl })}
        />
      ) : null}
      <PressableButton
        disabled={isDisabled}
        onPress={handlePress}
        accessibilityLabel={IMPORT_LABEL}
        accessibilityState={{ disabled: isDisabled }}
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
      {isImporting ? (
        <Text style={[styles.phase, { color: currentTheme.text }]}>
          {progress ? `${PHASE_LABELS[progress.phase]} ${progress.percent}%` : 'Поиск видео…'}
        </Text>
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  block: {
    marginBottom: INDENTS.medium,
  },
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
  hint: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.low,
  },
  phase: {
    fontSize: FONT_SIZES.sm,
    marginTop: INDENTS.low,
  },
})
