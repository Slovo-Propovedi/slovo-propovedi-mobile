import { Checkbox } from 'expo-checkbox'
import { Text, View } from 'react-native'
import { formatSermonReference } from 'entities/sermon'
import { CoverImage } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { type SermonOption } from '../lib/sermonOption'
import { pickerStyles } from './pickerStyles'

// Строка проповеди в поисковом списке выбора: обложка, название, подпись-ссылка.
export const SermonPickerRow = ({
  isSelected,
  onToggle,
  sermon,
}: {
  isSelected: boolean
  onToggle: () => void
  sermon: SermonOption
}) => {
  const { currentTheme } = useTheme()
  const reference = formatSermonReference({
    book: sermon.book,
    chapter: sermon.chapter,
    verse: sermon.verse,
  })
  const subtitle = [sermon.artist, reference].filter(Boolean).join(' · ')

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
      <CoverImage
        uri={sermon.artwork}
        style={pickerStyles.rowArtwork}
        imageStyle={pickerStyles.rowArtwork}
      />
      <View style={pickerStyles.rowBody}>
        <Text numberOfLines={1} style={[pickerStyles.rowTitle, { color: currentTheme.text }]}>
          {sermon.title}
        </Text>
        {subtitle ? (
          <Text numberOfLines={1} style={[pickerStyles.rowMeta, { color: currentTheme.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
    </TouchableItem>
  )
}
