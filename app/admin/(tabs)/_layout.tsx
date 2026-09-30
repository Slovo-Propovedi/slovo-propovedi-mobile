import { useAtom } from '@reatom/npm-react'
import { Tabs } from 'expo-router'
import { View } from 'react-native'
import { CustomTabBar } from 'widgets/tab-bar'
import { authUserAtom, isAdminUser } from 'entities/auth'
import { useTheme } from 'shared/ui/theme'

const AdminTabsLayout = () => {
  const { currentTheme } = useTheme()
  const [user] = useAtom(authUserAtom)

  return (
    <View style={{ backgroundColor: currentTheme.background, flex: 1 }}>
      <Tabs screenOptions={{ headerShown: false }} tabBar={props => <CustomTabBar {...props} />}>
        <Tabs.Screen name='index' options={{ title: 'Главная' }} />
        <Tabs.Screen name='sections' options={{ title: 'Разделы' }} />
        <Tabs.Screen name='playlists' options={{ title: 'Плейлисты' }} />
        <Tabs.Screen name='sermons' options={{ title: 'Проповеди' }} />
        <Tabs.Screen name='media' options={{ title: 'Медиа' }} />
        <Tabs.Screen
          name='users'
          options={{ href: isAdminUser(user) ? undefined : null, title: 'Пользователи' }}
        />
      </Tabs>
    </View>
  )
}

export default AdminTabsLayout
