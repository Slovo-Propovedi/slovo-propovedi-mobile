import { type ReactNode, useCallback, useEffect, useRef } from 'react'
import {
  KeyboardAvoidingView,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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

// Порог «почти конец» в долях высоты вьюпорта: 0.5 = половина экрана.
const NEAR_END_RATIO = 0.5

const SCROLL_TEST_ID = 'form-scroll-view'

/**
 * Скроллящееся тело формы с keyboard-avoidance. На iOS оборачивает ScrollView
 * в KeyboardAvoidingView с поведением padding, считая offset от safe-area сверху
 * и высоты шапки стека. На Android отдельный KAV не нужен: MainActivity объявлена
 * с adjustResize, поэтому контент уже доступен над клавиатурой.
 * @param props - Пропсы скроллящегося тела формы.
 * @param props.children - Содержимое формы (поля, блоки).
 * @param props.contentContainerStyle - Внутренний отступ контейнера ScrollView формы.
 * @param props.onNearEnd - Вызывается при приближении к низу; повторно — только
 * после роста высоты контента (то есть после подгрузки новой порции).
 */
export const FormScrollView = ({
  children,
  contentContainerStyle,
  onNearEnd,
}: {
  children: ReactNode
  contentContainerStyle?: StyleProp<ViewStyle>
  onNearEnd?: () => void
}) => {
  const { currentTheme } = useTheme()
  const insets = useSafeAreaInsets()
  const isIos = Platform.OS === 'ios'
  const onNearEndRef = useRef(onNearEnd)
  const firedAtHeightRef = useRef<null | number>(null)

  useEffect(() => {
    onNearEndRef.current = onNearEnd
  }, [onNearEnd])

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!onNearEndRef.current) return

    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent
    const distanceFromEnd = contentSize.height - (contentOffset.y + layoutMeasurement.height)

    if (distanceFromEnd > layoutMeasurement.height * NEAR_END_RATIO) {
      firedAtHeightRef.current = null

      return
    }

    if (firedAtHeightRef.current === contentSize.height) return

    firedAtHeightRef.current = contentSize.height
    onNearEndRef.current()
  }, [])

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={isIos ? 'padding' : undefined}
      keyboardVerticalOffset={isIos ? insets.top + NAV_HEADER_HEIGHT : 0}
    >
      <ScrollView
        testID={SCROLL_TEST_ID}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps='handled'
        contentContainerStyle={contentContainerStyle}
        style={{ backgroundColor: currentTheme.background }}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
