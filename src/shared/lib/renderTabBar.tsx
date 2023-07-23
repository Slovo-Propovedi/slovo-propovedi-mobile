import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native';
import { NavigationState, SceneRendererProps } from 'react-native-tab-view';
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
            outputRange: inputRange.map((inputIndex) => (inputIndex === i ? 1 : 0.5)),
          });

          const onPress = () => setActiveTabIndex(i);

          return (
            <TouchableOpacity
              key={`tab-bar-item-${route.key}`}
              style={styles.tabItem}
              onPress={onPress}
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
    flex: 1,
    alignItems: 'center',
    padding: INDENTS.main,
  },
});
