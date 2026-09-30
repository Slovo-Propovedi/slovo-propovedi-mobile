import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Плитка статистики раздела: подпись и значение.
export const SectionDetailStat = ({ label, value }: { label: string; value: string }) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.stat, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.statLabel, { color: currentTheme.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: currentTheme.text }]}>{value}</Text>
    </View>
  )
}
