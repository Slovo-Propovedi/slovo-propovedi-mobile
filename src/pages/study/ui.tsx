import React, { useState } from 'react'
import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { TabView } from 'react-native-tab-view'
import { getRenderTabBar } from 'shared/lib'
import { COLORS } from 'shared/themed'
import type { StudyStackParamName, StudyStackScreenProps } from 'shared/routing'
import { renderScene } from './scene'

export const StudyScreen: React.FC<StudyStackScreenProps<StudyStackParamName.Home>> = () => {
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
