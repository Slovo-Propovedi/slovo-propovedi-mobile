import { useAction } from '@reatom/npm-react'
import { type Href, Stack, useRouter } from 'expo-router'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { useAdminFormHeader } from 'widgets/admin-form-header'
import { type APITypes, sectionsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { useFormTouched } from 'shared/lib/hooks/useFormTouched'
import { isEmpty } from 'shared/lib/utils/isEmpty'
import { omitEqualFields } from 'shared/lib/utils/omitEqualFields'
import { showToast } from 'shared/model'
import { FormScrollView } from 'shared/ui/form'
import { useTheme } from 'shared/ui/theme'
import {
  buildCreateSectionDto,
  buildUpdateSectionDto,
  initialFormValues,
  type SectionFormValues,
} from '../lib/sectionFormState'
import { SectionFormAppearanceFields } from './SectionFormAppearanceFields'
import { SectionFormMainFields } from './SectionFormMainFields'
import { SectionFormPlaylistsFields } from './SectionFormPlaylistsFields'
import { styles } from './styles'

const CREATE_SUCCESS_MESSAGE = 'Раздел создан'
const UPDATE_SUCCESS_MESSAGE = 'Раздел сохранён'
const SECTIONS_FALLBACK_ROUTE: Href = '/admin/sections'
const REQUIRED_FIELDS = ['title'] as const

export const SectionForm = ({
  id = '',
  initial,
  mode,
}: {
  id?: string
  initial?: APITypes.SectionEntity
  mode: 'create' | 'edit'
}) => {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const showToastAction = useAction(showToast)
  const [initialValues] = useState<SectionFormValues>(() => initialFormValues(initial))
  const [values, setValues] = useState<SectionFormValues>(initialValues)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)
  const { markAllTouched, markTouched, touched } = useFormTouched<'title'>()

  const isEdit = mode === 'edit'
  const isDirty = !isEmpty(omitEqualFields(initialValues, values))
  const title = values.title.trim()
  const updateField = <K extends keyof SectionFormValues>(key: K, value: SectionFormValues[K]) =>
    setValues(prev => ({ ...prev, [key]: value }))

  const handleSubmit = async () => {
    markAllTouched(REQUIRED_FIELDS)
    if (title.length === 0) {
      const message = 'Укажите название раздела'
      setError(message)
      showToastAction(message)
      return
    }
    if (isSubmitting) return

    setError(null)
    setIsSubmitting(true)
    const api = sectionsApi.getSections()

    try {
      if (isEdit) {
        await api.sectionControllerUpdate(id, buildUpdateSectionDto(values))
        showToastAction(UPDATE_SUCCESS_MESSAGE)
      } else {
        await api.sectionControllerCreate(buildCreateSectionDto(values))
        showToastAction(CREATE_SUCCESS_MESSAGE)
      }
      router.back()
    } catch (submitError) {
      setError(getErrorMessage(submitError))
    } finally {
      setIsSubmitting(false)
    }
  }

  const headerOptions = useAdminFormHeader({
    fallbackRoute: SECTIONS_FALLBACK_ROUTE,
    isDirty,
    isSubmitting,
    onSave: () => void handleSubmit(),
    title: isEdit ? 'Редактировать раздел' : 'Создать раздел',
  })

  // Enter повторяет «Сохранить»: та же доступность, что у кнопки в шапке.
  const submitOnEnter = () => {
    if (isDirty && !isSubmitting) void handleSubmit()
  }

  return (
    <FormScrollView onSubmit={submitOnEnter} contentContainerStyle={styles.formContent}>
      <Stack.Screen options={headerOptions} />

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.errorText, { color: currentTheme.primary }]}>{error}</Text>
        </View>
      ) : null}

      <SectionFormMainFields
        values={values}
        touched={touched}
        onChange={updateField}
        markTouched={markTouched}
      />
      <SectionFormAppearanceFields values={values} onChange={updateField} />

      {isEdit ? (
        <SectionFormPlaylistsFields
          selectedIds={values.selectedPlaylistIds}
          onChange={ids => updateField('selectedPlaylistIds', ids)}
        />
      ) : null}
    </FormScrollView>
  )
}
