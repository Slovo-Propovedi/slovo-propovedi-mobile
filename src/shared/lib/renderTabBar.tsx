import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import type { NavigationState, SceneRendererProps } from 'react-native-tab-view';
import { INDENTS } from 'shared/themed';

type RenderTabBar = (
  props: SceneRendererProps & {
    navigationState: NavigationState<{
      key: string;
      title: string;
    }>;
  },
) => React.ReactNode;

type GetRenderTabBar = (props: { setActiveTabIndex: (index: number) => void }) => RenderTabBar;

export const getRenderTabBar: GetRenderTabBar =
  ({ setActiveTabIndex }) =>
  ({ navigationState, position }) => {
    const inputRange = navigationState.routes.map((x, i) => i);

    return (
      <View style={styles.tabBar}>
        {navigationState.routes.map((route, i) => {
          const opacity = position.interpolate({
            inputRange,
            outputRange: inputRange.map(inputIndex => (inputIndex === i ? 1 : 0.5)),
          });

          const onPress = () => setActiveTabIndex(i);

          return (
            <TouchableOpacity
              key={`tab-bar-item-${route.key}`}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Animated.Text style={{ opacity }}>{route.title}</Animated.Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    padding: INDENTS.high,
  },
});
