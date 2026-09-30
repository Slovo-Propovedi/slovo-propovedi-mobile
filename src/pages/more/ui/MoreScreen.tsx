import { useAction, useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { useEffect } from 'react'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authStatusAtom, authUserAtom, canAccessAdmin, restoreSession } from 'entities/auth'
import { APP_NAME, APP_VERSION } from 'shared/config'
import { useTheme } from 'shared/ui/theme'
import { AdminPanelButton } from './AdminPanelButton'
import { MoreMenuSettingsItem } from './MoreMenuSettingsItem'
import { styles } from './styles'

export const MoreScreen = () => {
  const router = useRouter()
  const { currentTheme } = useTheme()
  const restore = useAction(restoreSession)
  const [status] = useAtom(authStatusAtom)
  const [user] = useAtom(authUserAtom)

  useEffect(() => {
    if (status !== 'idle') return

    void restore()
  }, [status, restore])

  const canOpenAdminPanel = status === 'authenticated' && canAccessAdmin(user)

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

        {canOpenAdminPanel && <AdminPanelButton />}

        <View style={styles.menu}>
          <MoreMenuSettingsItem
            title='Офлайн'
            icon='cloud-offline-outline'
            onPress={() => router.push('/offline')}
          />
          <MoreMenuSettingsItem
            icon='time-outline'
            title='История прослушивания'
            onPress={() => router.push('/history')}
          />
          <MoreMenuSettingsItem
            title='Настройки'
            icon='settings-outline'
            onPress={() => router.push('/settings')}
          />
          <MoreMenuSettingsItem
            title='О приложении'
            icon='information-circle-outline'
            onPress={() => router.push('/about')}
          />
          <MoreMenuSettingsItem
            icon='share-social-outline'
            title='Поделиться приложением'
            onPress={() => router.push('/share')}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}
