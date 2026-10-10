import { Text, View } from 'react-native'
import { type APITypes } from 'shared/api'
import { AdminFlagRowSkeleton, MovingText } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

const ENABLED_LABEL = 'Включён'
const DISABLED_LABEL = 'Выключен'

// Карточка фича-флага в списке админки: название, ключ и бейдж глобального
// состояния (enabled).
export const AdminFlagRow = ({
  item,
  onPress,
}: {
  item: APITypes.FeatureFlag
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onPress}
      style={[styles.row, { backgroundColor: currentTheme.surface }]}
    >
      <View style={styles.rowBody}>
        <MovingText text={item.title} style={styles.rowTitle} />
        <Text numberOfLines={1} style={[styles.rowMeta, { color: currentTheme.textMuted }]}>
          {item.key}
        </Text>
      </View>
      <View
        style={[
          styles.badge,
          { backgroundColor: item.enabled ? currentTheme.primary : currentTheme.skeleton },
        ]}
      >
        <Text style={[styles.badgeText, { color: currentTheme.text }]}>
          {item.enabled ? ENABLED_LABEL : DISABLED_LABEL}
        </Text>
      </View>
    </TouchableItem>
  )
}

// Скелетон прикреплён к строке как `AdminFlagRow.Skeleton` — единый источник
// плейсхолдера для этой сущности.
AdminFlagRow.Skeleton = AdminFlagRowSkeleton
