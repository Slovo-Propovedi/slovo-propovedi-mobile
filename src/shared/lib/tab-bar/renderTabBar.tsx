import { Animated, StyleSheet, TouchableOpacity, View } from 'react-native'
import { type NavigationState, type SceneRendererProps } from 'react-native-tab-view'
import { INDENTS } from '../../ui/themed'

type GetRenderTabBar = (props: { setActiveTabIndex: (index: number) => void }) => RenderTabBar

type RenderTabBar = (
  props: {
    navigationState: NavigationState<{
      key: string
      title: string
    }>
  } & SceneRendererProps,
) => React.ReactNode

export const getRenderTabBar: GetRenderTabBar =
  ({ setActiveTabIndex }) =>
  ({ navigationState, position }) => {
    const inputRange = navigationState.routes.map((_, i) => i)

    return (
      <View style={styles.tabBar}>
        {navigationState.routes.map((route, i) => {
          const opacity = position.interpolate({
            inputRange,
            outputRange: inputRange.map(inputIndex => (inputIndex === i ? 1 : 0.5)),
          })

          const onPress = () => setActiveTabIndex(i)

          return (
            <TouchableOpacity
              onPress={onPress}
              style={styles.tabItem}
              key={`tab-bar-item-${route.key}`}
            >
              <Animated.Text style={{ opacity }}>{route.title}</Animated.Text>
            </TouchableOpacity>
          )
        })}
      </View>
    )
  }

const styles = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
    padding: INDENTS.high,
  },
})
