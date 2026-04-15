import { useAtom } from '@reatom/npm-react'
import { Tabs } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { ExpandablePlayer } from 'widgets/expandable-player'
import { CustomTabBar } from 'widgets/tab-bar'
import { isPlayerExpandedAtom } from 'entities/player'

interface TabLayout {
  width: number
  x: number
}

const Layout = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [tabLayouts, setTabLayoutsState] = useState<Record<string, TabLayout>>({})
  const [isPlayerExpanded] = useAtom(isPlayerExpandedAtom)

  const setTabLayout = (key: string, layout: TabLayout) => {
    setTabLayoutsState(prev => ({ ...prev, [key]: layout }))
  }

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={props => (
          <CustomTabBar
            {...props}
            tabLayouts={tabLayouts}
            currentIndex={currentIndex}
            setTabLayout={setTabLayout}
            setCurrentIndex={setCurrentIndex}
            hideFloatingPlayer={isPlayerExpanded}
          />
        )}
      >
        <Tabs.Screen name='listen' options={{ title: 'Слушать' }} />
        <Tabs.Screen name='read' options={{ title: 'Читать' }} />
        <Tabs.Screen name='study' options={{ title: 'Учаться' }} />
        <Tabs.Screen name='info' options={{ title: 'Информация' }} />
      </Tabs>
      <ExpandablePlayer />
    </View>
  )
}
export default Layout
