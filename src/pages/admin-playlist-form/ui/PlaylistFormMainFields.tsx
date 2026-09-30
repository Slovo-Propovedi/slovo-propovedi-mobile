import { Text, View } from 'react-native'
import { FormField } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import { type PlaylistFormValues } from '../lib/playlistFormState'
import { styles } from './styles'

type UpdateField = <K extends keyof PlaylistFormValues>(
  key: K,
  value: PlaylistFormValues[K],
) => void

// Блок «Основное» формы плейлиста: название и описание.
export const PlaylistFormMainFields = ({
  onChange,
  values,
}: {
  onChange: UpdateField
  values: PlaylistFormValues
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.group}>
      <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Основное</Text>
      <FormField
        label='Название'
        value={values.title}
        placeholder='Например: Воскресные проповеди'
        onChangeText={text => onChange('title', text)}
      />
      <FormField
        multiline
        label='Описание'
        hint='Необязательно.'
        value={values.description}
        placeholder='Короткое описание плейлиста'
        onChangeText={text => onChange('description', text)}
      />
    </View>
  )
}
