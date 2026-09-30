import { useAction } from '@reatom/npm-react'
import { type Href, Stack, useRouter } from 'expo-router'
import { useState } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { useAdminFormHeader } from 'widgets/admin-form-header'
import { type APITypes, sectionsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import { useTheme } from 'shared/ui/theme'
import {
  buildCreateSectionDto,
  buildUpdateSectionDto,
  initialFormValues,
  type SectionFormValues,
} from '../lib/sectionFormState'
import { PlaylistPicker } from './PlaylistPicker'
import { SectionFormAppearanceFields } from './SectionFormAppearanceFields'
import { SectionFormMainFields } from './SectionFormMainFields'
import { styles } from './styles'

const CREATE_SUCCESS_MESSAGE = 'Раздел создан'
const UPDATE_SUCCESS_MESSAGE = 'Раздел сохранён'
const SECTIONS_FALLBACK_ROUTE: Href = '/admin/sections'

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
  const [values, setValues] = useState<SectionFormValues>(() => initialFormValues(initial))
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<null | string>(null)

  const isEdit = mode === 'edit'
  const title = values.title.trim()
  const updateField = <K extends keyof SectionFormValues>(key: K, value: SectionFormValues[K]) =>
    setValues(prev => ({ ...prev, [key]: value }))

  const togglePlaylist = (playlistId: string) =>
    setValues(prev => ({
      ...prev,
      selectedPlaylistIds: prev.selectedPlaylistIds.includes(playlistId)
        ? prev.selectedPlaylistIds.filter(currentId => currentId !== playlistId)
        : [...prev.selectedPlaylistIds, playlistId],
    }))

  const handleSubmit = async () => {
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
    isSubmitting,
    onSave: () => void handleSubmit(),
    title: isEdit ? 'Редактировать раздел' : 'Создать раздел',
  })

  return (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.formContent}
      style={{ backgroundColor: currentTheme.background }}
    >
      <Stack.Screen options={headerOptions} />

      {error ? (
        <View style={[styles.errorBanner, { backgroundColor: currentTheme.surface }]}>
          <Text style={[styles.errorText, { color: currentTheme.primary }]}>{error}</Text>
        </View>
      ) : null}

      <SectionFormMainFields values={values} onChange={updateField} />
      <SectionFormAppearanceFields values={values} onChange={updateField} />

      {isEdit ? (
        <View style={styles.playlistsBlock}>
          <Text style={[styles.blockTitle, { color: currentTheme.text }]}>Плейлисты раздела</Text>
          <PlaylistPicker onToggle={togglePlaylist} selectedIds={values.selectedPlaylistIds} />
        </View>
      ) : null}
    </ScrollView>
  )
}
