import Ionicons from '@expo/vector-icons/Ionicons'
import { useRouter } from 'expo-router'
import { Text } from 'react-native'
import { useTheme } from 'shared/ui/theme'
import { TouchableItem } from 'shared/ui/touchable-item'
import { styles } from './styles'

export const AdminQuickActions = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()

  return (
    <>
      <Text style={[styles.sectionTitle, { color: currentTheme.textMuted }]}>Быстрые действия</Text>
      <TouchableItem
        style={[styles.actionRow, { backgroundColor: currentTheme.surface }]}
        onPress={() => {
          router.push('/admin/sermons/create')
        }}
      >
        <Ionicons size={22} name='cloud-upload-outline' color={currentTheme.primary} />
        <Text style={[styles.actionLabel, { color: currentTheme.text }]}>Загрузить проповедь</Text>
        <Ionicons size={20} name='chevron-forward' color={currentTheme.textMuted} />
      </TouchableItem>
    </>
  )
}
