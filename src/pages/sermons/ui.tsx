import { FC, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView } from 'react-native-tab-view';
import { SermonsStackParamName, SermonsStackScreenProps } from 'routing';
import { getRenderTabBar } from 'shared';
import { SermonsRoute, renderScene } from './scene';

export const SermonsScreen: FC<SermonsStackScreenProps<SermonsStackParamName.Sermons>> = () => {
  const [activeTabIndexIndex, setActiveTabIndexIndex] = useState(0);

  const routes = [
    { key: SermonsRoute.New, title: 'Новые' },
    { key: SermonsRoute.OnBible, title: 'По Библии' },
    { key: SermonsRoute.Topical, title: 'Тематические' },
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
