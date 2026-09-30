import { ActivityIndicator, Text } from 'react-native'
import { COLORS, useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

// Кнопка «Сохранить» в шапке экрана формы проповеди: всегда доступна при скролле.
export const SermonSaveButton = ({
  isSubmitting,
  onPress,
}: {
  isSubmitting: boolean
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <TouchableItem
      onPress={onPress}
      disabled={isSubmitting}
      style={[styles.saveButton, { backgroundColor: currentTheme.primary }]}
    >
      {isSubmitting ? (
        <ActivityIndicator color={COLORS.white} />
      ) : (
        <Text style={styles.saveButtonText}>Сохранить</Text>
      )}
    </TouchableItem>
  )
}
