import { type ReactNode } from 'react'
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTheme } from '../theme/ThemeContext/useTheme'

// Высота заголовка нативного стека без safe-area: iOS — 44pt (large title
// выключен в этой навигации), Android — 56dp. Нужна для keyboardVerticalOffset
// на iOS, чтобы поле не уезжало под шапку при поднятой клавиатуре.
const NAV_HEADER_HEIGHT = Platform.OS === 'ios' ? 44 : 56

/**
 * Скроллящееся тело формы с keyboard-avoidance. На iOS оборачивает ScrollView
 * в KeyboardAvoidingView с поведением padding, считая offset от safe-area сверху
 * и высоты шапки стека. На Android отдельный KAV не нужен: MainActivity объявлена
 * с adjustResize, поэтому контент уже доступен над клавиатурой.
 * @param props - Пропсы скроллящегося тела формы.
 * @param props.children - Содержимое формы (поля, блоки).
 * @param props.contentContainerStyle - Внутренний отступ контейнера ScrollView формы.
 */
export const FormScrollView = ({
  children,
  contentContainerStyle,
}: {
  children: ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
}) => {
  const { currentTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const isIos = Platform.OS === 'ios'

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={isIos ? 'padding' : undefined}
      keyboardVerticalOffset={isIos ? insets.top + NAV_HEADER_HEIGHT : 0}
    >
      <ScrollView
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={contentContainerStyle}
        style={{ backgroundColor: currentTheme.background }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
