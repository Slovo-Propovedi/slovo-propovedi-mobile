import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView } from 'react-native-tab-view';
import type { StudyStackParamName, StudyStackScreenProps } from 'shared';
import { getRenderTabBar } from 'shared';
import { renderScene } from './scene';

export const StudyScreen: React.FC<StudyStackScreenProps<StudyStackParamName.Home>> = () => {
  const [index, setIndex] = useState(0);

  const routes = [
    { key: 'first', title: 'Богословие' },
    { key: 'second', title: 'Душепопечение' },
  ];

  const renderTabBar = getRenderTabBar({
    setActiveTabIndex: setIndex,
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <TabView
          navigationState={{ index, routes }}
          onIndexChange={setIndex}
          renderScene={renderScene}
          renderTabBar={renderTabBar}
        />
      </View>
    </SafeAreaView>
  );
};
