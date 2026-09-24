import { Ionicons } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import { useState } from 'react'
import { Text, View } from 'react-native'
import { serverUrlAtom } from 'entities/settings'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { ServerUrlForm } from './ServerUrlForm'
import { styles } from './ServerUrlSettings.styles'

export const ServerUrlSettings = () => {
  const [expanded, setExpanded] = useState(false)
  const [currentUrl] = useAtom(serverUrlAtom)
  const { currentTheme } = useTheme()

  const handleToggle = () => setExpanded(prev => !prev)

  return (
    <View style={[styles.container, { backgroundColor: currentTheme.surface }]}>
      <TouchableItem onPress={handleToggle}>
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={[styles.title, { color: currentTheme.text }]}>URL сервера API</Text>
            <Text style={[styles.current, { color: currentTheme.textMuted }]}>
              Текущий: {currentUrl}
            </Text>
          </View>
          <Ionicons
            size={20}
            style={styles.headerChevron}
            color={currentTheme.textMuted}
            name={expanded ? 'chevron-up' : 'chevron-down'}
          />
        </View>
      </TouchableItem>
      {expanded ? <ServerUrlForm /> : null}
    </View>
  )
}
