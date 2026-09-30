import { Text, View } from 'react-native'
import { CoverPicker, FileUploadField } from 'widgets/admin-form-pickers'
import { FormField } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type SermonFormValues } from '../lib/sermonFormInitialValues'
import { styles } from './styles'

type UpdateField = <K extends keyof SermonFormValues>(key: K, value: SermonFormValues[K]) => void

// Блок «Медиа» формы проповеди: обложка, ссылка на YouTube, аудиофайл (MP3) и
// текстовый файл. Аудио и текст грузятся multipart-загрузкой с прогрессом.
export const SermonMediaFields = ({
  onChange,
  values,
}: {
  onChange: UpdateField
  values: SermonFormValues
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.block}>
      <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Медиа</Text>
      <CoverPicker value={values.artwork} onChange={value => onChange('artwork', value)} />
      <FormField
        label='YouTube (URL)'
        hint='Необязательно.'
        value={values.youtubeUrl}
        placeholder='https://youtube.com/…'
        onChangeText={text => onChange('youtubeUrl', text)}
      />
      <FileUploadField
        kind='audio'
        label='Аудио (MP3)'
        value={values.audioUrl}
        hint='Только формат MP3.'
        onChange={value => onChange('audioUrl', value)}
      />
      <FileUploadField
        kind='text'
        label='Текст (файл)'
        value={values.textFileUrl}
        hint='Необязательно. PDF, FB2 или TXT.'
        onChange={value => onChange('textFileUrl', value)}
      />
    </View>
  )
}
