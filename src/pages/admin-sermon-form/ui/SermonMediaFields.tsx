import { Text, View } from 'react-native'
import { CoverPicker, FileUploadField } from 'widgets/admin-form-pickers'
import { ImportFromYoutube } from 'features/sermon-audio-import'
import { EditableUrlField } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { DropStatusLine } from './DropStatusLine'
import { styles } from './styles'

type UpdateField = <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void

// Блок «Медиа» формы проповеди: обложка, ссылка на YouTube, аудиофайл (MP3/M4A)
// и текстовый файл. Аудио и текст грузятся multipart-загрузкой с прогрессом.
// На web файлы можно ещё и перетащить на страницу — за это отвечает
// родительский `SermonForm` (оверлей drop), а сюда приходит только статус.
export const SermonMediaFields = ({
  onChange,
  status,
  values,
}: {
  onChange: UpdateField
  status: {
    currentFileName: null | string
    error: null | string
    isUploading: boolean
    progress: number
  }
  values: SermonFormValues
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.block}>
      <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Медиа</Text>
      <CoverPicker value={values.artwork} onChange={value => onChange('artwork', value)} />
      <EditableUrlField
        label='YouTube (URL)'
        hint='Необязательно.'
        value={values.youtubeUrl}
        placeholder='https://youtube.com/…'
        onChangeText={text => onChange('youtubeUrl', text)}
      />
      <View style={styles.importBlock}>
        <ImportFromYoutube
          youtubeUrl={values.youtubeUrl}
          hasAudio={Boolean(values.audioUrl)}
          disabled={!values.youtubeUrl.trim()}
          onAudioImported={audioUrl => onChange('audioUrl', audioUrl)}
          onMetadata={({ description, title }) => {
            onChange('description', description ?? '')
            onChange('title', title)
          }}
        />
      </View>
      <FileUploadField
        kind='audio'
        value={values.audioUrl}
        label='Аудио (MP3, M4A)'
        onChange={value => onChange('audioUrl', value)}
        hint='MP3 или M4A. M4A появляется при импорте из YouTube/Invidious.'
      />
      <FileUploadField
        kind='text'
        label='Текст (файл)'
        value={values.textFileUrl}
        hint='Необязательно. PDF, FB2 или TXT.'
        onChange={value => onChange('textFileUrl', value)}
      />
      <DropStatusLine {...status} />
    </View>
  )
}
