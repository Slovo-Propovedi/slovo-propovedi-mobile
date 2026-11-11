import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Platform, StyleSheet, Text, View } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { getImportPhaseLabel, getImportProgressText } from '../lib/importPhaseLabel'
import { useImportSettings } from '../lib/importSettings'
import { type ImportedSermonMetadata } from '../lib/importTypes'
import { useAudioImport } from '../lib/useAudioImport'
import { useInvidiousInstances } from '../lib/useInvidiousInstances'
import { ImportProgressBar } from './ImportProgressBar'
import { ImportSourceSelect } from './ImportSourceSelect'

const IMPORT_HINT =
  'Скачивает аудиодорожку с YouTube и подставляет её вместе с названием и описанием.'

const IMPORT_LABEL = 'Импортировать'
const SEARCHING_LABEL = 'Поиск видео…'

/**
 * Блок импорта проповеди из YouTube/Invidious: строка «селектор источника +
 * кнопка импорта», необязательное поле своего инстанса и прогресс по фазам.
 * На native доступны оба источника; на web YouTube выключен, а сохранённый
 * выбор «YouTube» разрешается через Invidious.
 * @param props - Пропсы блока импорта.
 * @param props.disabled - Импорт невозможен (например, не заполнен URL).
 * @param props.hasAudio - В форме уже есть аудио: скачивание не запускается.
 * @param props.onAudioImported - Получает URL загруженного аудио для формы.
 * @param props.onMetadata - Получает название и описание сразу после разбора ссылки.
 * @param props.youtubeUrl - Ссылка или ID видео из поля формы.
 */
export const ImportAudioPanel = ({
  disabled,
  hasAudio,
  onAudioImported,
  onMetadata,
  youtubeUrl,
}: {
  disabled: boolean
  hasAudio: boolean
  onAudioImported: (audioUrl: string) => void
  onMetadata: (metadata: ImportedSermonMetadata) => void
  youtubeUrl: string
}) => {
  const { currentTheme } = useTheme()
  const { settings, updateSettings } = useImportSettings()
  const instances = useInvidiousInstances()
  const { isImporting, progress, startImport } = useAudioImport({
    hasAudio,
    onAudioImported,
    onMetadata,
    settings,
    url: youtubeUrl,
  })

  const selectInvidiousInstance = (url: string) => {
    if (url.trim() === '') return
    updateSettings({ invidiousBaseUrl: url, source: 'invidious' })
  }

  const isImportDisabled = disabled || isImporting

  return (
    <View>
      <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{IMPORT_HINT}</Text>
      <View style={styles.controlRow}>
        <ImportSourceSelect
          instances={instances}
          source={settings.source}
          isWeb={Platform.OS === 'web'}
          onSelectInstance={selectInvidiousInstance}
          invidiousBaseUrl={settings.invidiousBaseUrl}
          onSelectYoutube={() => updateSettings({ source: 'youtube' })}
        />
        <IconButton
          disabled={isImportDisabled}
          accessibilityLabel={IMPORT_LABEL}
          onPress={() => void startImport()}
          accessibilityState={{ disabled: isImportDisabled }}
          Icon={
            isImporting ? (
              <ActivityIndicator color={currentTheme.primary} />
            ) : (
              <Ionicons size={20} color={currentTheme.primary} name='cloud-download-outline' />
            )
          }
        />
      </View>
      {isImporting ? (
        <View style={styles.progress}>
          <Text style={[styles.phase, { color: currentTheme.text }]}>
            {progress ? getImportProgressText(progress) : SEARCHING_LABEL}
          </Text>
          {progress ? (
            <ImportProgressBar
              progress={progress.percent}
              accessibilityLabel={getImportPhaseLabel(progress)}
            />
          ) : null}
        </View>
      ) : null}
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
  hint: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.low,
  },
  phase: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.lowest,
  },
  // Статус прилипает к группе аплоада малым зазором.
  progress: {
    marginTop: INDENTS.lowest,
  },
})
