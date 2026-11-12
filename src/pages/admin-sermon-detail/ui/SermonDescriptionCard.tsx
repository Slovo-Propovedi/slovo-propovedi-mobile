import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

export const SermonDescriptionCard = ({ description }: { description: string }) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.card, { backgroundColor: currentTheme.surface }]}>
      <Text style={[styles.cardTitle, { color: currentTheme.text }]}>Описание</Text>
      <Text style={[styles.description, { color: currentTheme.textMuted }]}>{description}</Text>
    </View>
  )
}
