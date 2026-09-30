import { FormField } from 'shared/ui/form'
import { type PlaylistFormValues } from '../lib/playlistFormState'

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
}) => (
  <>
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
  </>
)
