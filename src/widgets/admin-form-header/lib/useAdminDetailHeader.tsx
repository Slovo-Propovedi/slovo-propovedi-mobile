import Ionicons from '@expo/vector-icons/Ionicons'
import { type Href, router } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { StyleSheet, View } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'

const DELETE_LABEL = 'Удалить'
const EDIT_LABEL = 'Редактировать'

/**
 * Опции шапки экрана детали админки: заголовок по центру и иконки справа —
 * «Редактировать» и, если передан `onDelete`, «Удалить». Back-стрелку и рамку
 * задаёт layout-стек раздела, поэтому здесь только заголовок и `headerRight`.
 *
 * Свежие `onDelete` держим в ref (синхронизация в эффекте, не во время рендера):
 * кнопки всегда вызывают актуальный обработчик, а сам callback не попадает в
 * зависимости `useMemo`. Наличие обработчика отслеживает стабильный boolean
 * `hasDelete` — только он и участвует в идентичности `headerRight`. Иначе
 * expo-router переустанавливал бы options каждый рендер (callers передают свежую
 * inline-стрелку) и уходил в «Maximum update depth exceeded».
 * @param options - Параметры шапки детали.
 * @param options.editRoute - Куда перейти по иконке «Редактировать».
 * @param options.onDelete - Открыть подтверждение удаления (скрыто, если не передан).
 * @param options.title - Заголовок экрана по центру.
 */
export const useAdminDetailHeader = ({
  editRoute,
  onDelete,
  title,
}: {
  editRoute: Href
  onDelete?: () => void
  title: string
}) => {
  const { currentTheme } = useTheme()
  const editRouteRef = useRef(editRoute)
  const onDeleteRef = useRef(onDelete)

  useEffect(() => {
    editRouteRef.current = editRoute
    onDeleteRef.current = onDelete
  })

  const handleEdit = useCallback(() => router.push(editRouteRef.current), [])
  const handleDelete = useCallback(() => onDeleteRef.current?.(), [])
  const hasDelete = onDelete !== undefined

  const headerRight = useMemo(
    () => () => (
      <View style={styles.row}>
        <IconButton
          onPress={handleEdit}
          accessibilityLabel={EDIT_LABEL}
          Icon={<Ionicons size={24} name='create-outline' color={currentTheme.primary} />}
        />
        {hasDelete ? (
          <IconButton
            onPress={handleDelete}
            accessibilityLabel={DELETE_LABEL}
            Icon={<Ionicons size={24} name='trash-outline' color={currentTheme.primary} />}
          />
        ) : null}
      </View>
    ),
    [currentTheme.primary, handleDelete, handleEdit, hasDelete],
  )

  return useMemo(() => ({ headerRight, title }), [headerRight, title])
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
})
