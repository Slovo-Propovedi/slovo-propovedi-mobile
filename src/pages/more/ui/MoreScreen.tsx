import { useRouter } from 'expo-router'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { APP_NAME, APP_VERSION } from 'shared/config'
import { useTheme } from 'shared/ui/theme'
import { MoreMenuSettingsItem } from './MoreMenuSettingsItem'
import { styles } from './styles'

export const MoreScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentTheme.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.appName, { color: currentTheme.text }]}>{APP_NAME}</Text>
          <Text style={styles.appVersion}>v{APP_VERSION}</Text>
        </View>
        <Text style={[styles.appDescription, { color: currentTheme.textMuted }]}>
          Приложение для прослушивания и чтения проповедей
        </Text>

        <View style={styles.menu}>
          <MoreMenuSettingsItem
            icon='time-outline'
            testID='history-item'
            title='История прослушивания'
            onPress={() => router.push('/history')}
          />
          <MoreMenuSettingsItem
            title='Настройки'
            testID='settings-item'
            icon='settings-outline'
            onPress={() => router.push('/settings')}
          />
          <MoreMenuSettingsItem
            testID='about-item'
            title='О приложении'
            icon='information-circle-outline'
            onPress={() => router.push('/about')}
          />
          <MoreMenuSettingsItem
            testID='share-item'
            icon='share-social-outline'
            title='Поделиться приложением'
            onPress={() => router.push('/share')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
