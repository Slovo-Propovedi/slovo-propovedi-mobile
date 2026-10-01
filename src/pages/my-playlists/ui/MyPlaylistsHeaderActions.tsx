import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'

const EDIT_LABEL = 'Изменить порядок'
const SAVE_LABEL = 'Сохранить'
const ICON_SIZE = 22

// Действия шапки экрана «Мои плейлисты». Карандаш «Изменить порядок» включает
// режим редактирования (повторный тап выходит из него, отбрасывая локальный
// порядок); в режиме редактирования рядом появляется галочка «Сохранить»,
// которая коммитит порядок. Когда редактировать нечего (только «Избранные»),
// действия не рендерятся.
export const MyPlaylistsHeaderActions = ({
  isEditable,
  isEditing,
  onSave,
  onToggleEdit,
}: {
  isEditable: boolean
  isEditing: boolean
  onSave: () => void
  onToggleEdit: () => void
}) => {
  const { currentTheme } = useTheme()

  if (!isEditable) return null

  return (
    <View style={styles.row}>
      <IconButton
        onPress={onToggleEdit}
        accessibilityLabel={EDIT_LABEL}
        Icon={<Ionicons size={ICON_SIZE} name='create-outline' color={currentTheme.primary} />}
      />
      {isEditing ? (
        <IconButton
          onPress={onSave}
          accessibilityLabel={SAVE_LABEL}
          Icon={<Ionicons size={ICON_SIZE} name='checkmark' color={currentTheme.primary} />}
        />
      ) : null}
    </View>
  )
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: INDENTS.lowest },
})
