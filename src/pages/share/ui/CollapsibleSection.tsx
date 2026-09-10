import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import type { ReactNode } from 'react'
import { styles } from './styles'

interface CollapsibleSectionProps {
  children: ReactNode
  isExpanded: boolean
  onToggle: () => void
  title: string
}

export const CollapsibleSection = ({
  children,
  isExpanded,
  onToggle,
  title,
}: CollapsibleSectionProps) => {
  const { currentTheme } = useTheme()

  return (
    <View style={[styles.section, { backgroundColor: currentTheme.surface }]}>
      <TouchableItem onPress={onToggle} style={styles.sectionHeader}>
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
