import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView } from 'react-native-tab-view';
import { StudyStackParamName, StudyStackScreenProps } from 'routing';
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
          renderTabBar={renderTabBar}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
        />
      </View>
    </SafeAreaView>
  );
};
