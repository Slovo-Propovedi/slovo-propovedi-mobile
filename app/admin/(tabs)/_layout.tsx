import { Tabs } from 'expo-router'
import { View } from 'react-native'
import { CustomTabBar } from 'widgets/tab-bar'
import { BlurTargetProvider } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'

// `media`/`flags`/`users` keep their routes for deep links and are opened from
// the «Главная» rows. `HIDDEN_TAB_ROUTE_NAMES` in `widgets/tab-bar` must stay
// in sync with these `href: null` screens.
const AdminTabsLayout = () => {
  const { currentTheme } = useTheme()

  return (
    <BlurTargetProvider>
      <View style={{ backgroundColor: currentTheme.background, flex: 1 }}>
        <Tabs
          screenOptions={{ headerShown: false }}
          tabBar={props => <CustomTabBar {...props} hideSearch />}
        >
          <Tabs.Screen name='index' options={{ title: 'Главная' }} />
          <Tabs.Screen name='sections' options={{ title: 'Разделы' }} />
          <Tabs.Screen name='playlists' options={{ title: 'Плейлисты' }} />
          <Tabs.Screen name='sermons' options={{ title: 'Проповеди' }} />
          <Tabs.Screen name='media' options={{ href: null, title: 'Медиа' }} />
          <Tabs.Screen name='flags' options={{ href: null, title: 'Флаги' }} />
          <Tabs.Screen name='users' options={{ href: null, title: 'Пользователи' }} />
        </Tabs>
      </View>
    </BlurTargetProvider>
  )
}

export default AdminTabsLayout
