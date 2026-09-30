import { useAtom } from '@reatom/npm-react'
import { Tabs } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { CustomTabBar } from 'widgets/tab-bar'
import { authUserAtom, isAdminUser } from 'entities/auth'
import { useTheme } from 'shared/ui/theme'

interface TabLayout {
  width: number
  x: number
}

const AdminTabsLayout = () => {
  const { currentTheme } = useTheme()
  const [user] = useAtom(authUserAtom)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tabLayouts, setTabLayoutsState] = useState<Record<string, TabLayout>>({})

  const setTabLayout = (key: string, layout: TabLayout) => {
    setTabLayoutsState(prev => ({ ...prev, [key]: layout }))
  }

  return (
    <View style={{ backgroundColor: currentTheme.background, flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={props => (
          <CustomTabBar
            {...props}
            tabLayouts={tabLayouts}
            currentIndex={currentIndex}
            setTabLayout={setTabLayout}
            setCurrentIndex={setCurrentIndex}
          />
        )}
      >
        <Tabs.Screen name='index' options={{ title: 'Главная' }} />
        <Tabs.Screen name='sections' options={{ title: 'Разделы' }} />
        <Tabs.Screen name='playlists' options={{ title: 'Плейлисты' }} />
        <Tabs.Screen name='sermons' options={{ title: 'Проповеди' }} />
        <Tabs.Screen name='upload' options={{ title: 'Загрузить' }} />
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
