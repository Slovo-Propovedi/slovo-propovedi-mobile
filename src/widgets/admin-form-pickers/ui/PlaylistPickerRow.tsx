import { Checkbox } from 'expo-checkbox'
import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { pickerStyles } from './pickerStyles'

// Строка плейлиста в поисковом списке выбора: чекбокс, название, счётчик.
export const PlaylistPickerRow = ({
  isSelected,
  onToggle,
  playlist,
}: {
  isSelected: boolean
  onToggle: () => void
  playlist: APITypes.PlaylistEntity
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onToggle}
      style={pickerStyles.row}
      accessibilityState={{ checked: isSelected }}
    >
      <Checkbox
        value={isSelected}
        style={pickerStyles.checkbox}
        color={isSelected ? currentTheme.primary : currentTheme.textMuted}
      />
      <View style={pickerStyles.rowBody}>
        <Text numberOfLines={1} style={[pickerStyles.rowTitle, { color: currentTheme.text }]}>
          {playlist.title}
        </Text>
        <Text style={[pickerStyles.rowMeta, { color: currentTheme.textMuted }]}>
          {`${playlist.sermons.length} проповедей`}
        </Text>
      </View>
    </TouchableItem>
  )
}
