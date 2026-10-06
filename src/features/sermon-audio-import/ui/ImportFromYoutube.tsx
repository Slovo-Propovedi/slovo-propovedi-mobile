import { Platform, StyleSheet, Text, View } from 'react-native'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { getImportPhaseLabel, getImportProgressText } from '../lib/importPhaseLabel'
import { useImportSettings } from '../lib/importSettings'
import { type ImportedSermonMetadata, type ImportSource } from '../lib/importTypes'
import { useAudioImport } from '../lib/useAudioImport'
import { useInvidiousInstances } from '../lib/useInvidiousInstances'
import { ImportButton } from './ImportButton'
import { ImportInstanceField } from './ImportInstanceField'
import { ImportProgressBar } from './ImportProgressBar'
import { ImportSourcePicker } from './ImportSourcePicker'

const IMPORT_HINT =
  'Скачивает аудиодорожку с YouTube и подставляет её вместе с названием и описанием.'

const SEARCHING_LABEL = 'Поиск видео…'

// На web InnerTube недоступен (шимы и `eval` в браузере не поддержаны), поэтому
// YouTube-чип показан, но выключен, а импорт всегда идёт через Invidious.
const WEB_DISABLED_SOURCES: readonly ImportSource[] = ['youtube']
const NO_DISABLED_SOURCES: readonly ImportSource[] = []

/**
 * Блок импорта проповеди из YouTube/Invidious под полем «YouTube (URL)»: выбор
 * источника, адрес инстанса Invidious, кнопка импорта с прогрессом по фазам.
 * На native доступны оба источника; на web — только Invidious (YouTube-чип
 * выключен), сохранённый выбор «YouTube» уходит в Invidious.
 * @param props - Пропсы блока импорта.
 * @param props.disabled - Импорт невозможен (например, не заполнен URL).
 * @param props.hasAudio - В форме уже есть аудио: скачивание не запускается.
 * @param props.onAudioImported - Получает URL загруженного аудио для формы.
 * @param props.onMetadata - Получает название и описание сразу после разбора ссылки.
 * @param props.youtubeUrl - Ссылка или ID видео из поля формы.
 */
export const ImportFromYoutube = ({
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
  const presets = useInvidiousInstances()
  const { isImporting, progress, startImport } = useAudioImport({
    hasAudio,
    onAudioImported,
    onMetadata,
    settings,
    url: youtubeUrl,
  })

  const handlePress = () => void startImport()

  // Пока первый отчёт источника не пришёл, фаза неизвестна — показываем поиск
  // видео, чтобы админ не смотрел на «Скачивание… 0%».
  const isWeb = Platform.OS === 'web'
  const effectiveSource = isWeb ? 'invidious' : settings.source
  const isDisabled = disabled || isImporting

  return (
    <View>
      <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{IMPORT_HINT}</Text>
      <ImportSourcePicker
        source={effectiveSource}
        onSelect={source => updateSettings({ source })}
        disabledSources={isWeb ? WEB_DISABLED_SOURCES : NO_DISABLED_SOURCES}
      />
      {effectiveSource === 'invidious' ? (
        <ImportInstanceField
          presets={presets}
          invidiousBaseUrl={settings.invidiousBaseUrl}
          onChange={invidiousBaseUrl => updateSettings({ invidiousBaseUrl })}
        />
      ) : null}
      <ImportButton disabled={isDisabled} onPress={handlePress} isImporting={isImporting} />
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
  hint: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.low,
  },
  phase: {
    fontSize: FONT_SIZES.sm,
    marginBottom: INDENTS.lowest,
  },
  // Статус прилипает к группе аплоада малым зазором, а внешний отступ до
  // следующего поля даёт страница (SermonMediaFields) — под статусом.
  progress: {
    marginTop: INDENTS.lowest,
  },
})
