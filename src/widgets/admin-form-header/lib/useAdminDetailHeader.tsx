import Ionicons from '@expo/vector-icons/Ionicons'
import { type Href, router } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'

const EDIT_LABEL = 'Редактировать'

/**
 * Опции шапки экрана детали админки: заголовок по центру и иконка
 * «Редактировать» справа. Back-стрелку и рамку задаёт layout-стек раздела,
 * поэтому здесь только заголовок и `headerRight`.
 *
 * Свежий `onEdit` держим в ref (синхронизация в эффекте, не во время рендера):
 * кнопка всегда вызывает актуальный обработчик, но идентичность `headerRight`
 * не меняется каждый рендер — иначе expo-router ушёл бы в
 * «Maximum update depth exceeded».
 * @param options - Параметры шапки детали.
 * @param options.editRoute - Куда перейти по иконке «Редактировать».
 * @param options.title - Заголовок экрана по центру.
 */
export const useAdminDetailHeader = ({ editRoute, title }: { editRoute: Href; title: string }) => {
  const { currentTheme } = useTheme()
  const editRouteRef = useRef(editRoute)

  useEffect(() => {
    editRouteRef.current = editRoute
  }, [editRoute])

  const handleEdit = useCallback(() => router.push(editRouteRef.current), [])

  const headerRight = useMemo(
    () => () => (
      <IconButton
        onPress={handleEdit}
        accessibilityLabel={EDIT_LABEL}
        Icon={<Ionicons size={24} name='create-outline' color={currentTheme.primary} />}
      />
    ),
    [currentTheme.primary, handleEdit],
  )

  return useMemo(() => ({ headerRight, title }), [headerRight, title])
}
