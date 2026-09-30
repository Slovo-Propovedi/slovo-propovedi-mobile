import Ionicons from '@expo/vector-icons/Ionicons'
import { Text, View } from 'react-native'
import { IconButton } from 'shared/ui/icon-button'
import { useTheme } from 'shared/ui/theme'
import { styles } from './styles'

const CREATE_LABEL = 'Создать пользователя'

// Шапка экрана «Пользователи»: заголовок слева и иконка создания справа.
export const AdminUsersHeader = ({ onCreate }: { onCreate: () => void }) => {
  const { currentTheme } = useTheme()

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: currentTheme.text }]}>Пользователи</Text>
          <Text style={[styles.subtitle, { color: currentTheme.textMuted }]}>
            Управление администраторами системы.
          </Text>
        </View>
        <IconButton
          onPress={onCreate}
          accessibilityLabel={CREATE_LABEL}
          Icon={<Ionicons size={24} name='person-add-outline' color={currentTheme.primary} />}
        />
      </View>
    </View>
  )
}
