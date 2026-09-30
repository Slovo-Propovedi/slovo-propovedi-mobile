import { type ReactNode } from 'react'
import { type StyleProp, View, type ViewStyle } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSkeletonPulse } from '../skeleton/useSkeletonPulse'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { styles } from './styles'

// Внутренний плейсхолдер-бар: цвет чуть темнее фона карточки строки.
export const SkeletonBar = ({ style }: { style?: StyleProp<ViewStyle> }) => {
  const { currentTheme } = useTheme()

  return <View style={[styles.bar, { backgroundColor: currentTheme.card }, style]} />
}

// Карточка-плейсхолдер строки админского списка: рамка, радиус, отступ и
// пульсация как в основных скелетах приложения.
export const AdminSkeletonRow = ({
  children,
  style,
}: {
  children: ReactNode
  style?: StyleProp<ViewStyle>
}) => {
  const { currentTheme } = useTheme()
  const { pulseStyle } = useSkeletonPulse()

  return (
    <Animated.View
      testID='admin-skeleton-row'
      style={[
        styles.row,
        { backgroundColor: currentTheme.surface, borderColor: currentTheme.textMuted },
        pulseStyle,
        style,
        { pointerEvents: 'none' },
      ]}
    >
      {children}
    </Animated.View>
  )
}
