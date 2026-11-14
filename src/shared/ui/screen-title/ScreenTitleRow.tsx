import { type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { styles } from './styles'

export const ScreenTitleRow = ({ children, title }: { children?: ReactNode; title: string }) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.row}>
      <Text accessibilityRole='header' style={[styles.title, { color: currentTheme.text }]}>
        {title}
      </Text>
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  )
}
