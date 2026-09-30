import { type TouchedMap } from 'shared/lib/hooks/useFormTouched'
import { FormField } from 'shared/ui/form'
import { type SectionFormValues } from '../lib/sectionFormState'

const isBlank = (value: string) => value.trim() === ''

// Блок «Основное» формы раздела: название (обязательно) и описание.
export const SectionFormMainFields = ({
  markTouched,
  onChange,
  touched,
  values,
}: {
  markTouched: (key: 'title') => void
  onChange: <K extends keyof SectionFormValues>(key: K, value: SectionFormValues[K]) => void
  touched: TouchedMap<'title'>
  values: SectionFormValues
}) => (
  <>
    <FormField
      required
      label='Название'
      value={values.title}
      onBlur={() => markTouched('title')}
      placeholder='Например: Последние проповеди'
      onChangeText={text => onChange('title', text)}
      invalid={Boolean(touched.title) && isBlank(values.title)}
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
