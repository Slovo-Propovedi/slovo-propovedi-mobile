import { Animated, StyleSheet, View } from 'react-native'
import { type NavigationState, type SceneRendererProps } from 'react-native-tab-view'
import { INDENTS } from '../../ui/theme/themed'
import { TouchableButton } from '../../ui/touchable-button'

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
            <TouchableButton
              onPress={onPress}
              style={styles.tabItem}
              key={`tab-bar-item-${route.key}`}
            >
              <Animated.Text style={{ opacity }}>{route.title}</Animated.Text>
            </TouchableButton>
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
