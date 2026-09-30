import { type SectionFormValues } from '../lib/sectionFormState'
import { FormField } from './FormField'

// Блок «Основное» формы раздела: название и описание.
export const SectionFormMainFields = ({
  onChange,
  values,
}: {
  onChange: <K extends keyof SectionFormValues>(key: K, value: SectionFormValues[K]) => void
  values: SectionFormValues
}) => (
  <>
    <FormField
      label='Название'
      value={values.title}
      placeholder='Например: Последние проповеди'
      onChangeText={text => onChange('title', text)}
    />
    <FormField
      multiline
      label='Описание'
      hint='Необязательно.'
      value={values.description}
      placeholder='Короткое описание раздела'
      onChangeText={text => onChange('description', text)}
    />
  </>
)
