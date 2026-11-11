import { useState } from 'react'
import { Platform, StyleSheet, Text, View } from 'react-native'
import { INPUT_LIMITS } from 'shared/lib/validation/inputLimits'
import { FormField } from 'shared/ui/form'
import { FONT_SIZES, INDENTS, useTheme } from 'shared/ui/theme'
import { getImportPhaseLabel, getImportProgressText } from '../lib/importPhaseLabel'
import { useImportSettings } from '../lib/importSettings'
import { type ImportedSermonMetadata } from '../lib/importTypes'
import { useAudioImport } from '../lib/useAudioImport'
import { useInvidiousInstances } from '../lib/useInvidiousInstances'
import { ImportControlsRow } from './ImportControlsRow'
import { ImportProgressBar } from './ImportProgressBar'

const IMPORT_HINT =
  'Скачивает аудиодорожку с YouTube и подставляет её вместе с названием и описанием.'

const URL_LABEL = 'YouTube (URL)'
const URL_PLACEHOLDER = 'https://youtube.com/…'
const SEARCHING_LABEL = 'Поиск видео…'

/**
 * Блок импорта проповеди из YouTube/Invidious: поле ссылки, строка «селектор
 * источника + кнопка импорта», необязательное поле своего инстанса и прогресс
 * по фазам. Ссылка живёт в локальном черновике: по нажатию импорта она
 * сохраняется в форму (`onImportUrl`) и сразу становится ссылкой импорта.
 * На native доступны оба источника; на web YouTube выключен, а сохранённый
 * выбор «YouTube» разрешается через Invidious.
 * @param props - Пропсы блока импорта.
 * @param props.hasAudio - В форме уже есть аудио: скачивание не запускается.
 * @param props.onAudioImported - Получает URL загруженного аудио для формы.
 * @param props.onImportUrl - Получает черновик ссылки при нажатии импорта.
 * @param props.onMetadata - Получает название и описание сразу после разбора ссылки.
 * @param props.youtubeUrl - Начальное значение поля ссылки (из формы).
 */
export const ImportAudioPanel = ({
  hasAudio,
  onAudioImported,
  onImportUrl,
  onMetadata,
  youtubeUrl,
}: {
  hasAudio: boolean
  onAudioImported: (audioUrl: string) => void
  onImportUrl: (url: string) => void
  onMetadata: (metadata: ImportedSermonMetadata) => void
  youtubeUrl: string
}) => {
  const { currentTheme } = useTheme()
  const { settings, updateSettings } = useImportSettings()
  const instances = useInvidiousInstances()
  const [draftUrl, setDraftUrl] = useState(youtubeUrl)
  const url = draftUrl.trim()
  const { isImporting, progress, startImport } = useAudioImport({
    hasAudio,
    onAudioImported,
    onMetadata,
    settings,
    url,
  })

  const selectInvidiousInstance = (nextUrl: string) => {
    if (nextUrl.trim() === '') return
    updateSettings({ invidiousBaseUrl: nextUrl, source: 'invidious' })
  }

  const importFromDraft = () => {
    if (url === '') return
    onImportUrl(url)
    void startImport()
  }

  return (
    <View>
      <Text style={[styles.hint, { color: currentTheme.textMuted }]}>{IMPORT_HINT}</Text>
      <FormField
        value={draftUrl}
        label={URL_LABEL}
        onChangeText={setDraftUrl}
        placeholder={URL_PLACEHOLDER}
        maxLength={INPUT_LIMITS.sermon.youtubeUrl}
      />
      <ImportControlsRow
        instances={instances}
        source={settings.source}
        isImporting={isImporting}
        isWeb={Platform.OS === 'web'}
        onPressImport={importFromDraft}
        disabled={isImporting || url === ''}
        onSelectInstance={selectInvidiousInstance}
        invidiousBaseUrl={settings.invidiousBaseUrl}
        onSelectYoutube={() => updateSettings({ source: 'youtube' })}
      />
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
  // Статус прилипает к группе аплоада малым зазором.
  progress: {
    marginTop: INDENTS.lowest,
  },
})
