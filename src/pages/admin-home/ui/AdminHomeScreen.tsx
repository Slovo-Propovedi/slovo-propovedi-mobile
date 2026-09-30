import { useAtom } from '@reatom/npm-react'
import { useRouter } from 'expo-router'
import { ScrollView, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { authUserAtom } from 'entities/auth'
import { useTheme } from 'shared/ui/theme'
import { useAdminStats } from '../lib/useAdminStats'
import { AdminHomeHeader } from './AdminHomeHeader'
import { AdminQuickActions } from './AdminQuickActions'
import { AdminStatCard } from './AdminStatCard'
import { styles } from './styles'

export const AdminHomeScreen = () => {
  const router = useRouter()
  const [user] = useAtom(authUserAtom)
  const { currentTheme } = useTheme()
  const stats = useAdminStats()

  return (
    <SafeAreaView
      edges={['top']}
      style={[styles.container, { backgroundColor: currentTheme.background }]}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <AdminHomeHeader user={user} />

        <View style={styles.cards}>
          <AdminStatCard
            title='Разделы'
            icon='grid-outline'
            count={stats.sections}
            isLoading={stats.isLoading}
            onPress={() => {
              router.push('/admin/sections')
            }}
          />
          <AdminStatCard
            title='Плейлисты'
            icon='list-outline'
            count={stats.playlists}
            isLoading={stats.isLoading}
            onPress={() => {
              router.push('/admin/playlists')
            }}
          />
          <AdminStatCard
            title='Проповеди'
            icon='mic-outline'
            count={stats.sermons}
            isLoading={stats.isLoading}
            onPress={() => {
              router.push('/admin/sermons')
            }}
          />
        </View>

        <Text style={[styles.sectionTitle, { color: currentTheme.textMuted }]}>
          Быстрые действия
        </Text>
        <AdminQuickActions />
      </ScrollView>
    </SafeAreaView>
  )
}
