import { Ionicons } from '@expo/vector-icons'
import { type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { TouchableItem } from '../touchable-item'
import { styles } from './CollapsibleGroup.styles'

// Сворачиваемая группа настроек: заголовок (+ опц. иконка/подзаголовок), при
// нажатии раскрывает/скрывает children. Тело рендерится только в раскрытом
// состоянии (условный рендер) — свёрнутые элементы недостижимы и для a11y.
export const CollapsibleGroup = ({
  children,
  expanded,
  icon,
  onToggle,
  subtitle,
  title,
}: {
  children: ReactNode
  expanded: boolean
  icon?: keyof typeof Ionicons.glyphMap
  onToggle: () => void
  subtitle?: string
  title: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.surface }]}>
      <TouchableItem onPress={onToggle} style={styles.header} accessibilityState={{ expanded }}>
        {icon ? (
          <Ionicons size={24} name={icon} style={styles.icon} color={currentTheme.text} />
        ) : null}
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: currentTheme.text }]}>{title}</Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>{subtitle}</Text>
          ) : null}
        </View>
        <Ionicons
          size={20}
          style={styles.chevron}
          accessibilityElementsHidden
          color={currentTheme.textMuted}
          importantForAccessibility='no'
          name={expanded ? 'chevron-up' : 'chevron-down'}
        />
      </TouchableItem>
      {expanded ? <View>{children}</View> : null}
    </View>
  )
}
