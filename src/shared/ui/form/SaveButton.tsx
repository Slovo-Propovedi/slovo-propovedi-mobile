import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator } from 'react-native'
import { IconButton } from '../icon-button'
import { useTheme } from '../theme/ThemeContext/useTheme'

// Кнопка «Сохранить» в шапке админ-формы: иконка-дискета (save-outline), всегда
// доступна во время скролла. Во время отправки — спиннер вместо иконки, кнопка disabled.
export const SaveButton = ({
  isSubmitting,
  onPress,
}: {
  isSubmitting: boolean
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <IconButton
      onPress={onPress}
      disabled={isSubmitting}
      accessibilityLabel='Сохранить'
      Icon={
        isSubmitting ? (
          <ActivityIndicator color={currentTheme.primary} />
        ) : (
          <Ionicons size={24} name='save-outline' color={currentTheme.primary} />
        )
      }
    />
  )
}
