import { useCallback, useEffect, useMemo, useRef } from 'react'
import { SermonSaveButton } from '../ui/SermonSaveButton'

/**
 * Опции шапки экрана формы проповеди с кнопкой «Сохранить» справа.
 *
 * Свежий `onSave` держим в ref (синхронизация в эффекте, не во время рендера):
 * кнопка всегда вызывает актуальный обработчик, но идентичность `headerRight`
 * не меняется от нажатия клавиши — иначе expo-router переустанавливал бы
 * options каждый рендер и уходил в «Maximum update depth exceeded».
 * @param isSubmitting - Идёт ли отправка формы.
 * @param onSave - Обработчик сохранения формы.
 */
export const useSermonFormHeader = (isSubmitting: boolean, onSave: () => void) => {
  const onSaveRef = useRef(onSave)

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  const handleSave = useCallback(() => onSaveRef.current(), [])

  return useMemo(
    () => ({
      headerRight: () => <SermonSaveButton onPress={handleSave} isSubmitting={isSubmitting} />,
    }),
    [handleSave, isSubmitting],
  )
}
