import { Ionicons } from '@expo/vector-icons'
import { StyleSheet, View } from 'react-native'
import { SliderTitle } from 'shared/ui'
import { IconButton } from 'shared/ui/icon-button'
import { FONT_SIZES, useTheme } from 'shared/ui/theme'

const EDIT_LABEL = 'Изменить порядок'
const SAVE_LABEL = 'Сохранить'
const ICON_SIZE = 22

// Шапка секции «Мои плейлисты»: заголовок и действия справа. Карандаш
// «Изменить порядок» переключает режим редактирования (повторный тап выходит из
// него, отбрасывая локальный порядок). В режиме редактирования рядом — галочка
// «Сохранить», которая коммитит порядок.
export const MyPlaylistsHeader = ({
  isEditing,
  onSave,
  onToggleEdit,
  title,
}: {
  isEditing: boolean
  onSave: () => void
  onToggleEdit: () => void
  title: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.row}>
      <View style={styles.title}>
        <SliderTitle title={title} fontSize={FONT_SIZES.h2} />
      </View>
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
  row: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  title: { flex: 1 },
})
