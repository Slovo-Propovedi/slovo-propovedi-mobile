import React, { useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabView } from 'react-native-tab-view'
import { renderScene } from 'pages/study/scene'
import { getRenderTabBar } from 'shared/lib/tab-bar'
import { COLORS } from 'shared/themed'

const StudyScreen = () => {
  const [index, setIndex] = useState(0)

  const routes = [
    { key: 'first', title: 'Богословие' },
    { key: 'second', title: 'Душепопечение' },
  ]

  const renderTabBar = getRenderTabBar({
    setActiveTabIndex: setIndex,
  })

  return (
    <SafeAreaView style={{ backgroundColor: COLORS.white, flex: 1 }}>
      <View style={{ flex: 1, paddingBottom: 100 }}>
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

export default StudyScreen
