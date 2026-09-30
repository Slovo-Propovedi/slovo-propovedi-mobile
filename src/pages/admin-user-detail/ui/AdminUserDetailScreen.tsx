import Ionicons from '@expo/vector-icons/Ionicons'
import { type Href, Stack, useLocalSearchParams, useRouter } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, ScrollView, Text, View } from 'react-native'
import { useAdminDetailHeader } from 'widgets/admin-form-header'
import { useRequireAdminRole } from 'entities/auth'
import { EmptyState } from 'shared/ui'
import { ConfirmDialog } from 'shared/ui/confirm-dialog'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { useAdminUserDetail } from '../lib/useAdminUserDetail'
import { PasswordDialog } from './PasswordDialog'
import { styles } from './styles'
import { UserStatGrid } from './UserStatGrid'

const DELETE_TITLE = 'Удалить пользователя?'
const PASSWORD_LABEL = 'Сменить пароль'
const DELETE_LABEL = 'Удалить'
const NOT_FOUND_MESSAGE = 'Пользователь не найден'

// Деталь пользователя: статистика и действие «Сменить пароль».
// «Редактировать» и «Удалить» живут в шапке экрана (headerRight). Удаление
// собственного аккаунта скрыто — иконки удаления в шапке нет.
export const AdminUserDetailScreen = () => {
  useRequireAdminRole()
  const router = useRouter()
  const { currentTheme } = useTheme()
  const params = useLocalSearchParams<{ id: string }>()
  const id = params.id ?? ''
  const { changePassword, isChangingPassword, isDeleting, isNotFound, isOwnAccount, remove, user } =
    useAdminUserDetail(id)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isPasswordOpen, setIsPasswordOpen] = useState(false)

  const handleDelete = async () => {
    setIsDeleteOpen(false)
    if (await remove()) router.back()
  }

  // Own account: no delete icon in the header at all (mirrors the server guard).
  const editRoute = useMemo<Href>(
    () => ({ params: { id }, pathname: '/admin/users/[id]/edit' }),
    [id],
  )
  const headerOptions = useAdminDetailHeader({
    editRoute,
    onDelete: isOwnAccount ? undefined : () => setIsDeleteOpen(true),
    title: user?.name ?? '',
  })

  if (!user)
    return (
      <View style={[styles.centered, { backgroundColor: currentTheme.background }]}>
        {isNotFound ? (
          <EmptyState message={NOT_FOUND_MESSAGE} />
        ) : (
          <ActivityIndicator size='large' color={COLORS.primary} />
        )}
      </View>
    )

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <Stack.Screen options={headerOptions} />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: currentTheme.primary }]}>
            <Text style={styles.avatarText}>{user.name.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: currentTheme.text }]}>{user.name}</Text>
            <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>{user.email}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <TouchableItem
            onPress={() => setIsPasswordOpen(true)}
            style={[styles.actionButton, { backgroundColor: currentTheme.surface }]}
          >
            <Ionicons size={18} name='key-outline' color={currentTheme.textMuted} />
            <Text style={[styles.actionText, { color: currentTheme.textMuted }]}>
              {PASSWORD_LABEL}
            </Text>
          </TouchableItem>
        </View>

        <UserStatGrid user={user} />
      </ScrollView>

      <ConfirmDialog
        title={DELETE_TITLE}
        visible={isDeleteOpen}
        onConfirm={() => void handleDelete()}
        onCancel={() => setIsDeleteOpen(false)}
        confirmText={isDeleting ? 'Удаление…' : DELETE_LABEL}
        message={`Пользователь «${user.name}» будет удалён без возможности восстановления.`}
      />
      <PasswordDialog
        visible={isPasswordOpen}
        onSubmit={changePassword}
        isSubmitting={isChangingPassword}
        onClose={() => setIsPasswordOpen(false)}
      />
    </View>
  )
}
