import { Text, View } from 'react-native'
import { ITEMS_SIZE_LABELS, TRANSFORM_LABELS } from 'entities/section'
import { type APITypes } from 'shared/api'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Малые бейджи раздела: размер карточек и высота карточек.
export const AdminSectionBadges = ({
  itemsSize,
  transform,
}: {
  itemsSize: APITypes.SectionEntityItemsSize
  transform: APITypes.SectionEntityTransform
}) => {
  const { currentTheme } = useTheme()
  const labels = [ITEMS_SIZE_LABELS[itemsSize], TRANSFORM_LABELS[transform]]

  return (
    <View style={styles.badges}>
      {labels.map(label => (
        <View key={label} style={[styles.badge, { borderColor: currentTheme.textMuted }]}>
          <Text style={[styles.badgeText, { color: currentTheme.textMuted }]}>{label}</Text>
        </View>
      ))}
    </View>
  )
}
