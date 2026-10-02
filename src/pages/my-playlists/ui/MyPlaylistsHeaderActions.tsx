import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { INDENTS, useTheme } from 'shared/ui/theme'

const EDIT_LABEL = 'Изменить порядок'
const SAVE_LABEL = 'Сохранить'
const ICON_SIZE = 22

// Действия шапки экрана «Мои плейлисты». В обычном режиме виден карандаш
// «Изменить порядок» — включает режим редактирования. В режиме редактирования
// карандаш скрывается и остаётся только галочка «Сохранить», которая коммитит
// порядок; незакоммиченный порядок отбрасывается при уходе с экрана.
export const MyPlaylistsHeaderActions = ({
  isEditing,
  onSave,
  onToggleEdit,
}: {
  isEditing: boolean
  onSave: () => void
  onToggleEdit: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.row}>
      {!isEditing ? (
        <IconButton
          onPress={onToggleEdit}
          accessibilityLabel={EDIT_LABEL}
          Icon={<Ionicons size={ICON_SIZE} name='create-outline' color={currentTheme.primary} />}
        />
      ) : null}
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
