import { type Href, Stack, useLocalSearchParams } from 'expo-router'
import { View } from 'react-native'
import { useAdminFormHeader } from 'widgets/admin-form-header'
import { type APITypes } from 'shared/api'
import { AdminContentSkeleton, EmptyState } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { useAdminFlagEntity } from '../lib/useAdminFlagEntity'
import { useFlagFormController } from '../lib/useFlagFormController'
import { FlagForm } from './FlagForm'
import { styles } from './styles'

const FLAGS_FALLBACK_ROUTE: Href = '/admin/flags'
const NOT_FOUND_MESSAGE = 'Флаг не найден'

// Экран редактирования фича-флага: грузит сущность и монтирует форму только
// после успешной загрузки, чтобы пропсы initial оставались стабильными.
export const AdminFlagEditScreen = () => {
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { flag, isLoading, isNotFound } = useAdminFlagEntity(id)

  if (flag)
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        <FlagEditForm id={id} initial={flag} />
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
          <EmptyState message={NOT_FOUND_MESSAGE} />
        </View>
      )}
    </View>
  )
}

// Отдельный компонент: хук формы монтируется только когда сущность загружена.
const FlagEditForm = ({ id, initial }: { id: string; initial: APITypes.FeatureFlag }) => {
  const { error, isDirty, isSubmitting, markTouched, onChange, save, touched, values } =
    useFlagFormController({
      id,
      initial,
      mode: 'edit',
    })
  const headerOptions = useAdminFormHeader({
    fallbackRoute: FLAGS_FALLBACK_ROUTE,
    isDirty,
    isSubmitting,
    onSave: save,
    title: 'Редактировать флаг',
  })

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <FlagForm
        mode='edit'
        error={error}
        values={values}
        touched={touched}
        onChange={onChange}
        markTouched={markTouched}
      />
    </>
  )
}
