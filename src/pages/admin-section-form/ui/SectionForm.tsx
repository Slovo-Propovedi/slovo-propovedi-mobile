import { useAction } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { type APITypes, sectionsApi } from 'shared/api'
import { getErrorMessage } from 'shared/lib/error-utils'
import { showToast } from 'shared/model'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
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
  const canSubmit = values.title.trim().length > 0 && !isSubmitting
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

  return (
    <ScrollView
      keyboardShouldPersistTaps='handled'
      contentContainerStyle={styles.formContent}
      style={{ backgroundColor: currentTheme.background }}
    >
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

      <TouchableItem
        disabled={!canSubmit}
        onPress={() => void handleSubmit()}
        style={[
          styles.submit,
          { backgroundColor: currentTheme.primary, opacity: canSubmit ? 1 : 0.5 },
        ]}
      >
        {isSubmitting ? (
          <ActivityIndicator color={COLORS.white} />
        ) : (
          <Text style={styles.submitText}>{isEdit ? 'Сохранить' : 'Создать'}</Text>
        )}
      </TouchableItem>
    </ScrollView>
  )
}
