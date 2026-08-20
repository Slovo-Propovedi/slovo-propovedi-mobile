import { useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabView } from 'react-native-tab-view'
import { getRenderTabBar } from 'shared/lib/tab-bar'
import { useTheme } from 'shared/ui/theme'
import { renderScene } from './scene'

export const StudyScreen = () => {
  const { currentTheme } = useTheme()
  const [index, setIndex] = useState(0)

  const routes = [
    { key: 'first', title: 'Богословие' },
    { key: 'second', title: 'Душепопечение' },
  ]

  const renderTabBar = getRenderTabBar({
    setActiveTabIndex: setIndex,
  })

  return (
    <SafeAreaView style={{ backgroundColor: currentTheme.background, flex: 1 }}>
      <View style={{ backgroundColor: currentTheme.background, flex: 1, paddingBottom: 100 }}>
        <TabView
          onIndexChange={setIndex}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
          navigationState={{ index, routes }}
        />
      </View>
    </SafeAreaView>
  )
}
