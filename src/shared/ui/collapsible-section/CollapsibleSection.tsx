import Ionicons from '@expo/vector-icons/Ionicons'
import { type ReactNode } from 'react'
import { Text, View } from 'react-native'
import { useTheme } from '../theme/ThemeContext/useTheme'
import { TouchableItem } from '../touchable-item'
import { styles } from './styles'

// Сворачиваемая секция: заголовок-кнопка со стрелкой и тело, видимое только в
// развёрнутом состоянии. Используется аккордеонами админки и экраном «Поделиться».
export const CollapsibleSection = ({
  children,
  isExpanded,
  onToggle,
  title,
}: {
  children: ReactNode
  isExpanded: boolean
  onToggle: () => void
  title: string
}) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
      <TouchableItem
        onPress={onToggle}
        style={styles.sectionHeader}
        accessibilityState={{ expanded: isExpanded }}
      >
        <Text style={[styles.sectionTitle, { color: currentTheme.text }]}>{title}</Text>
        <Ionicons
          size={20}
          accessibilityElementsHidden
          color={currentTheme.textMuted}
          importantForAccessibility='no'
          name={isExpanded ? 'chevron-up' : 'chevron-down'}
        />
      </TouchableItem>
      {isExpanded && <View style={styles.sectionBody}>{children}</View>}
    </View>
  )
}
