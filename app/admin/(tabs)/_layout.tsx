import { Tabs } from 'expo-router'
import { View } from 'react-native'
import { CustomTabBar } from 'widgets/tab-bar'
import { BlurTargetProvider } from 'shared/ui'
import { useTheme } from 'shared/ui/theme'

// `media`/`flags`/`users` are stack screens registered in `app/admin/_layout.tsx`
// and opened from the «Главная» rows, so they have no place in this tab bar.
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
        </Tabs>
      </View>
    </BlurTargetProvider>
  )
}

export default AdminTabsLayout
