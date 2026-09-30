import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator, Text } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

export const AdminStatCard = ({
  count,
  icon,
  isLoading,
  onPress,
  title,
}: {
  count: null | number
  icon: keyof typeof Ionicons.glyphMap
  isLoading: boolean
  onPress: () => void
  title: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onPress}
      style={[styles.card, { backgroundColor: currentTheme.surface }]}
    >
      <Ionicons size={24} name={icon} color={currentTheme.primary} />
      {isLoading ? (
        <ActivityIndicator color={currentTheme.primary} />
      ) : (
        <Text style={[styles.count, { color: currentTheme.text }]}>{count ?? '—'}</Text>
      )}
      <Text style={[styles.cardTitle, { color: currentTheme.textMuted }]}>{title}</Text>
    </TouchableItem>
  )
}
