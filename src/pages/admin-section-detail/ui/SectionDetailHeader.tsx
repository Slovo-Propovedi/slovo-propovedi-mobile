import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

// Шапка детали раздела: название и описание. «Редактировать» и «Удалить» живут
// в шапке экрана (headerRight).
export const SectionDetailHeader = ({
  description,
  title,
}: {
  description: null | string
  title: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
      {description ? (
        <Text style={[styles.description, { color: currentTheme.textMuted }]}>{description}</Text>
      ) : null}
    </View>
  )
}
