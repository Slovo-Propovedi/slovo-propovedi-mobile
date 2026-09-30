import { Checkbox } from 'expo-checkbox'
import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { pickerStyles } from './pickerStyles'
import { styles } from './styles'

// Строка плейлиста в поисковом списке выбора: чекбокс, название, счётчик.
export const PlaylistPickerRow = ({
  isSelected,
  onToggle,
  playlist,
}: {
  isSelected: boolean
  onToggle: () => void
  playlist: { id: string; sermons: unknown[]; title: string }
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onToggle}
      style={pickerStyles.pickerRow}
      accessibilityState={{ checked: isSelected }}
    >
      <Checkbox
        value={isSelected}
        style={styles.checkbox}
        color={isSelected ? currentTheme.primary : currentTheme.textMuted}
      />
      <View style={pickerStyles.pickerRowBody}>
        <Text numberOfLines={1} style={[pickerStyles.pickerRowTitle, { color: currentTheme.text }]}>
          {playlist.title}
        </Text>
        <Text style={[pickerStyles.pickerRowMeta, { color: currentTheme.textMuted }]}>
          {`${playlist.sermons.length} проповедей`}
        </Text>
      </View>
    </TouchableItem>
  )
}
