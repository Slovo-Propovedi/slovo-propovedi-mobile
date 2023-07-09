import { FC, useState } from 'react';
import { Animated, StatusBar, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NavigationState, SceneRendererProps, TabView } from 'react-native-tab-view';
import { MainStackScreenProps } from 'routing';
import { AppHeader } from 'widgets/app-header';
import { renderScene } from './scene';

export const HomeScreen: FC<MainStackScreenProps<'Home'>> = () => {
  const [index, setIndex] = useState(0);

  const routes = [
    { key: 'first', title: 'Проповеди' },
    { key: 'second', title: 'Другое' },
  ];

  const renderTabBar: (
    props: SceneRendererProps & {
      navigationState: NavigationState<{
        key: string;
        title: string;
      }>;
    },
  ) => React.ReactNode = ({ navigationState, position }) => {
    const inputRange = navigationState.routes.map((x, i) => i);

    return (
      <View style={styles.tabBar}>
        {navigationState.routes.map((route, i) => {
          const opacity = position.interpolate({
            inputRange,
            outputRange: inputRange.map((inputIndex) => (inputIndex === i ? 1 : 0.5)),
          });

          return (
            <TouchableOpacity
              key={`tab-bar-item-${route.key}`}
              style={styles.tabItem}
              onPress={() => setIndex(i)}
            >
              <Animated.Text style={{ opacity }}>{route.title}</Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {/* Со ScrollView компонент TabView не работает */}
      {/* <ScrollView style={styles.scroll}> */}
      <AppHeader />
      <View style={{ flex: 1 }}>
        <TabView
          renderTabBar={renderTabBar}
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
        />
      </View>
      {/* </ScrollView> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: StatusBar.currentHeight,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
  },
});
