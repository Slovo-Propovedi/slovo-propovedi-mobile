import Ionicons from '@expo/vector-icons/Ionicons'
import { ActivityIndicator } from 'react-native'
import { IconButton } from '../icon-button'
import { useTheme } from '../theme/ThemeContext/useTheme'

// Кнопка «Сохранить» в шапке админ-формы: иконка-галочка (checkmark), всегда
// доступна во время скролла. Во время отправки — спиннер вместо иконки. Кнопка
// disabled, пока форма не изменена (isDirty) или идёт отправка (isSubmitting).
export const SaveButton = ({
  isDirty,
  isSubmitting,
  onPress,
}: {
  isDirty: boolean
  isSubmitting: boolean
  onPress: () => void
}) => {
  const { currentTheme } = useTheme()

  return (
    <IconButton
      onPress={onPress}
      accessibilityLabel='Сохранить'
      disabled={!isDirty || isSubmitting}
      Icon={
        isSubmitting ? (
          <ActivityIndicator color={currentTheme.primary} />
        ) : (
          <Ionicons size={24} name='checkmark' color={currentTheme.primary} />
        )
      }
    />
  )
}
