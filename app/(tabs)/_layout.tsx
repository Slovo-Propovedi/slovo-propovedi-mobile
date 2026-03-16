import { Tabs } from 'expo-router'
import { useState } from 'react'
import { CustomTabBar } from './tab-bar'

interface TabLayout {
  width: number
  x: number
}

const Layout = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tabLayouts, setTabLayoutsState] = useState<Record<string, TabLayout>>({})

  const setTabLayout = (key: string, layout: TabLayout) => {
    setTabLayoutsState(prev => ({ ...prev, [key]: layout }))
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
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
      <Tabs.Screen name='listen' options={{ title: 'Слушать' }} />
      <Tabs.Screen name='read' options={{ title: 'Читать' }} />
      <Tabs.Screen name='study' options={{ title: 'Учиться' }} />
      <Tabs.Screen name='info' options={{ title: 'Информация' }} />
    </Tabs>
  )
}
export default Layout
