import Ionicons from '@expo/vector-icons/Ionicons'
import { type Href, router } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { type ColorValue } from 'react-native'
import { HeaderBackButton } from 'widgets/sub-screen-header-back'
import { SaveButton } from 'shared/ui/form'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'

const EDIT_LABEL = 'Редактировать'

/**
 * Полные опции шапки экрана админ-формы: «назад» слева, заголовок по центру и
 * иконки справа — «Редактировать» (для деталей) и «Сохранить» (для форм).
 * Экран задаёт их сам через `Stack.Screen`, поэтому шапка не зависит от мержа
 * опций с layout-стеком.
 *
 * Свежие обработчики держим в ref (синхронизация в эффекте, не во время рендера):
 * кнопки всегда вызывают актуальный обработчик, но идентичность `headerRight`
 * не меняется от каждого нажатия клавиши — иначе expo-router переустанавливал бы
 * options каждый рендер и уходил в «Maximum update depth exceeded».
 * @param options - Параметры шапки формы.
 * @param options.editRoute - Куда перейти по иконке «Редактировать» (для деталей).
 * @param options.fallbackRoute - Куда вернуться, если истории нет (web-reload).
 * @param options.isDirty - Есть ли в форме изменения (кнопка «Сохранить» активна).
 * @param options.isSubmitting - Идёт ли отправка формы (только для форм).
 * @param options.onEdit - Обработчик иконки «Редактировать» (для деталей).
 * @param options.onSave - Обработчик сохранения формы.
 * @param options.title - Заголовок экрана по центру.
 */
export const useAdminFormHeader = ({
  editRoute,
  fallbackRoute,
  isDirty = false,
  isSubmitting = false,
  onEdit,
  onSave,
  title,
}: {
  editRoute?: Href
  fallbackRoute: Href
  isDirty?: boolean
  isSubmitting?: boolean
  onEdit?: () => void
  onSave?: () => void
  title: string
}) => {
  const { currentTheme } = useTheme()
  const onSaveRef = useRef(onSave)
  const onEditRef = useRef(onEdit)

  useEffect(() => {
    onSaveRef.current = onSave
    onEditRef.current = onEdit
  })

  const handleSave = useCallback(() => onSaveRef.current?.(), [])
  const handleEdit = useCallback(() => {
    if (onEditRef.current) {
      onEditRef.current()
      return
    }
    if (editRoute) router.push(editRoute)
  }, [editRoute])

  const renderBack = useCallback(
    (props: { tintColor?: ColorValue }) => (
      <HeaderBackButton tintColor={props.tintColor} fallbackRoute={fallbackRoute} />
    ),
    [fallbackRoute],
  )

  const renderEdit = useCallback(
    () => (
      <IconButton
        onPress={handleEdit}
        accessibilityLabel={EDIT_LABEL}
        Icon={<Ionicons size={24} name='create-outline' color={currentTheme.primary} />}
      />
    ),
    [handleEdit, currentTheme.primary],
  )

  const headerRight = useMemo(() => {
    if (onSave)
      return () => <SaveButton isDirty={isDirty} onPress={handleSave} isSubmitting={isSubmitting} />

    return renderEdit
  }, [handleSave, isDirty, isSubmitting, onSave, renderEdit])

  return useMemo(
    () => ({ headerLeft: renderBack, headerRight, title }),
    [headerRight, renderBack, title],
  )
}
