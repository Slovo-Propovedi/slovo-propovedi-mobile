import { type Href, Stack, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { useAdminFormHeader } from 'widgets/admin-form-header'
import { type APITypes } from 'shared/api'
import { AdminContentSkeleton, EmptyState } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { useAdminSermonEntity } from '../lib/useAdminSermonEntity'
import { useSermonFormController } from '../lib/useSermonFormController'
import { SermonForm } from './SermonForm'
import { styles } from './styles'

const SERMONS_FALLBACK_ROUTE: Href = '/admin/sermons'

// Экран редактирования проповеди: грузит сущность и монтирует форму только
// после успешной загрузки, чтобы пропсы initial оставались стабильными.
export const AdminSermonEditScreen = () => {
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { isLoading, isNotFound, sermon } = useAdminSermonEntity(id)

  if (sermon)
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <SermonEditForm id={id} initial={sermon} />
      </View>
    )

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      {isLoading && !isNotFound ? (
        <View style={styles.formContent}>
          <AdminContentSkeleton />
        </View>
      ) : (
        <View style={styles.centered}>
          <EmptyState message='Проповедь не найдена' />
        </View>
      )}
    </View>
  )
}

// Отдельный компонент: хук формы монтируется только когда сущность загружена.
const SermonEditForm = ({ id, initial }: { id: string; initial: APITypes.SermonEntity }) => {
  const {
    error,
    isDirty,
    isSubmitting,
    markTouched,
    onChange,
    onChapterEndChange,
    save,
    touched,
    values,
  } = useSermonFormController({ id, initial, mode: 'edit' })
  const headerOptions = useAdminFormHeader({
    fallbackRoute: SERMONS_FALLBACK_ROUTE,
    isDirty,
    isSubmitting,
    onSave: save,
    title: 'Редактировать проповедь',
  })

  // Enter повторяет «Сохранить»: та же доступность, что у кнопки в шапке.
  const submitOnEnter = () => {
    if (isDirty && !isSubmitting) void save()
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <SermonForm
        error={error}
        values={values}
        touched={touched}
        onChange={onChange}
        onSubmit={submitOnEnter}
        markTouched={markTouched}
        onChapterEndChange={onChapterEndChange}
      />
    </>
  )
}
