import { type Href, Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { View } from 'react-native'
import { useAdminDetailHeader } from 'widgets/admin-form-header'
import { useRequireAdminRole } from 'entities/auth'
import { AdminContentSkeleton, EmptyState } from 'shared/ui'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { useTheme } from 'shared/ui/theme'
import { useAdminFlagDetail } from '../lib/useAdminFlagDetail'
import { useOverrideUsers } from '../lib/useOverrideUsers'
import { FlagOverridesList } from './FlagOverridesList'
import { styles } from './styles'

const DELETE_TITLE = 'Удалить флаг?'
const DELETE_LABEL = 'Удалить'
const FLAG_NOT_FOUND_MESSAGE = 'Флаг не найден'

// Деталь фича-флага: карточка флага, удаление в шапке и блок пер-пользовательских
// исключений (поиск пользователей + grant/deny/clear по каждому).
export const AdminFlagDetailScreen = () => {
  useRequireAdminRole()
  const router = useRouter()
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { clearOverride, flag, isDeleting, isNotFound, overridesState, remove, setOverride } =
    useAdminFlagDetail(id)
  const usersState = useOverrideUsers()
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleteOpen(false)
    if (await remove()) router.back()
  }

  const editRoute = useMemo<Href>(
    () => ({ params: { id }, pathname: '/admin/flags/[id]/edit' }),
    [id],
  )
  const headerOptions = useAdminDetailHeader({
    editRoute,
    onDelete: () => setIsDeleteOpen(true),
    title: flag?.title ?? '',
  })

  if (!flag)
    return (
      <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
        {isNotFound ? (
          <View style={styles.centered}>
            <EmptyState message={FLAG_NOT_FOUND_MESSAGE} />
          </View>
        ) : (
          <View style={styles.content}>
            <AdminContentSkeleton />
          </View>
        )}
      </View>
    )

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={headerOptions} />
      <FlagOverridesList
        flag={flag}
        usersState={usersState}
        overridesState={overridesState}
        onClearOverride={userId => void clearOverride(userId)}
        onSetOverride={(userId, value) => void setOverride(userId, value)}
      />

      <ConfirmDialog
        title={DELETE_TITLE}
        visible={isDeleteOpen}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
        confirmText={isDeleting ? 'Удаление…' : DELETE_LABEL}
        message={`Флаг «${flag.title}» будет удалён без возможности восстановления.`}
      />
    </View>
  )
}
