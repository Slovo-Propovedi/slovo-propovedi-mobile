import Ionicons from '@expo/vector-icons/Ionicons'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { ActivityIndicator } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'

const ICON_SIZE = 24
const SAVE_LABEL = 'Сохранить'

/**
 * Иконка «Сохранить» в шапке экрана «Источники импорта». Повторяет дисциплину
 * `useAdminListHeaderActions`: свежий обработчик держим в ref (синхронизация в
 * эффекте, не во время рендера), а в зависимости `useMemo` входят только
 * стабильные значения и дискретные флаги — иначе expo-router переустанавливает
 * options на каждый рендер и уходит в «Maximum update depth exceeded».
 *
 * Кнопка disabled, пока список не изменён (`isDirty`) или идёт сохранение;
 * во время сохранения вместо иконки — спиннер.
 * @param options - Параметры кнопки сохранения.
 * @param options.isDirty - Есть ли несохранённые правки.
 * @param options.isSaving - Идёт ли сохранение списка.
 * @param options.onSave - Обработчик сохранения.
 */
export const useInvidiousSaveHeader = ({
  isDirty,
  isSaving,
  onSave,
}: {
  isDirty: boolean
  isSaving: boolean
  onSave: () => void
}) => {
  const { currentTheme } = useTheme()
  const onSaveRef = useRef(onSave)

  useEffect(() => {
    onSaveRef.current = onSave
  })

  const handleSave = useCallback(() => onSaveRef.current(), [])

  const headerRight = useMemo(
    () => () => (
      <IconButton
        onPress={handleSave}
        accessibilityLabel={SAVE_LABEL}
        disabled={!isDirty || isSaving}
        Icon={
          isSaving ? (
            <ActivityIndicator color={currentTheme.primary} />
          ) : (
            <Ionicons size={ICON_SIZE} name='save-outline' color={currentTheme.primary} />
          )
        }
      />
    ),
    [currentTheme.primary, handleSave, isDirty, isSaving],
  )

  return useMemo(() => ({ headerRight }), [headerRight])
}
