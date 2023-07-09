import { FC, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TabView } from 'react-native-tab-view';
import { SermonsStackParamName, SermonsStackScreenProps } from 'routing';
import { getRenderTabBar } from 'shared';
import { renderScene } from './scene';

export const HomeScreen: FC<SermonsStackScreenProps<SermonsStackParamName.Home>> = () => {
  const [index, setIndex] = useState(0);

  const routes = [
    { key: 'first', title: 'Новые' },
    { key: 'second', title: 'По Библии' },
    { key: 'third', title: 'Тематические' },
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
