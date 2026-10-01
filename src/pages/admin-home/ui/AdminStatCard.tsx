import Ionicons from '@expo/vector-icons/Ionicons'
import { Text } from 'react-native'
import Animated from 'react-native-reanimated'
import { SkeletonBar } from 'shared/ui/admin-skeleton'
import { useSkeletonPulse } from 'shared/ui/skeleton/useSkeletonPulse'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Карточка статистики главной админки: иконка, число и подпись. Пока данные
// грузятся, вместо числа пульсирует плейсхолдер-бар.
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
      <StatValue count={count} isLoading={isLoading} />
      <Text style={[styles.cardTitle, { color: currentTheme.textMuted }]}>{title}</Text>
    </TouchableItem>
  )
}

const StatValue = ({ count, isLoading }: { count: null | number; isLoading: boolean }) => {
  const { currentTheme } = useTheme()
  const { pulseStyle } = useSkeletonPulse()

  if (!isLoading)
    return <Text style={[styles.count, { color: currentTheme.text }]}>{count ?? '—'}</Text>

  return (
    <Animated.View
      testID='admin-stat-card-skeleton'
      style={[pulseStyle, { pointerEvents: 'none' }]}
    >
      <SkeletonBar style={styles.statCountBar} />
    </Animated.View>
  )
}
