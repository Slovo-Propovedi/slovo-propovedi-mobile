import { useCallback, useEffect, useMemo, useRef } from 'react'
import { MyPlaylistsHeaderActions } from '../ui/MyPlaylistsHeaderActions'

const SCREEN_TITLE = 'Мои плейлисты'

/**
 * Опции шапки экрана «Мои плейлисты»: заголовок секции и действия справа —
 * карандаш «Изменить порядок» (всегда активен) и, в режиме редактирования,
 * галочка «Сохранить».
 *
 * Свежие обработчики держим в ref (синхронизация в эффекте, не во время
 * рендера): кнопки вызывают актуальные обработчики, но идентичность
 * `headerRight` не меняется на каждый рендер — иначе expo-router ушёл бы в
 * «Maximum update depth exceeded». Режим редактирования входит в зависимости
 * memo: смена режима обязана пересобрать `headerRight` (иначе иконки шапки
 * не обновятся).
 * @param root0 Параметры шапки.
 * @param root0.isEditing Открыт ли режим редактирования.
 * @param root0.onSave Коммит локального порядка.
 * @param root0.onToggleEdit Вход в режим редактирования / выход без сохранения.
 */
export const useMyPlaylistsHeader = ({
  isEditing,
  onSave,
  onToggleEdit,
}: {
  isEditing: boolean
  onSave: () => void
  onToggleEdit: () => void
}) => {
  const onSaveRef = useRef(onSave)
  const onToggleEditRef = useRef(onToggleEdit)

  useEffect(() => {
    onSaveRef.current = onSave
    onToggleEditRef.current = onToggleEdit
  })

  const handleSave = useCallback(() => onSaveRef.current(), [])
  const handleToggleEdit = useCallback(() => onToggleEditRef.current(), [])

  const headerRight = useMemo(
    () => () => (
      <MyPlaylistsHeaderActions
        onSave={handleSave}
        isEditing={isEditing}
        onToggleEdit={handleToggleEdit}
      />
    ),
    [handleSave, handleToggleEdit, isEditing],
  )

  return useMemo(() => ({ headerRight, title: SCREEN_TITLE }), [headerRight])
}
