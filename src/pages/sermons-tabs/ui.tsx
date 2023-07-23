import React, { useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView } from 'react-native-tab-view';
import { SermonsStackParamName, SermonsStackScreenProps } from 'routing';
import { getRenderTabBar } from 'shared';
import { SermonsTab, renderScene } from './scene';

export const SermonsTabsScreen: React.FC<
  SermonsStackScreenProps<SermonsStackParamName.SermonsTabs>
> = () => {
  const [activeTabIndexIndex, setActiveTabIndexIndex] = useState(0);

  const routes = [
    { key: SermonsTab.New, title: 'Новые' },
    { key: SermonsTab.OnBible, title: 'По Библии' },
    { key: SermonsTab.Topical, title: 'Тематические' },
  ];

  const renderTabBar = getRenderTabBar({
    setActiveTabIndex: setActiveTabIndexIndex,
  });

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={{ flex: 1 }}>
        <TabView
          renderTabBar={renderTabBar}
          navigationState={{ index: activeTabIndexIndex, routes }}
          renderScene={renderScene}
          onIndexChange={setActiveTabIndexIndex}
        />
      </View>
    </SafeAreaView>
  );
};
