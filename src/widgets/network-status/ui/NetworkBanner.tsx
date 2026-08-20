import { Feather } from '@expo/vector-icons'
import { useAtom } from '@reatom/npm-react'
import { Pressable, StyleSheet, Text } from 'react-native'
import Animated from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { isOnlineAtom } from 'shared/model'
import { COLORS, FONT_SIZES, INDENTS } from 'shared/ui/theme'
import { useNetworkIslandAnimation } from './useNetworkIslandAnimation'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

export const NetworkBanner = () => {
  const [isOnline] = useAtom(isOnlineAtom)
  const insets = useSafeAreaInsets()
  const { collapse, containerStyle, contentStyle, expand, isExpanded } =
    useNetworkIslandAnimation(isOnline)

  if (isOnline) return null

  return (
    <AnimatedPressable
      testID='network-banner'
      hitSlop={isExpanded ? 0 : 16}
      onPress={() => (isExpanded ? collapse() : expand())}
      style={[styles.container, { top: insets.top + INDENTS.low }, containerStyle]}
    >
      <Animated.View style={[styles.pill, contentStyle]}>
        <Feather size={16} name='wifi-off' color={COLORS.white} />
        <Text style={styles.text}>Офлайн</Text>
      </Animated.View>
    </AnimatedPressable>
  )
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: COLORS.error,
    elevation: 5,
    overflow: 'hidden',
    position: 'absolute',
    shadowColor: COLORS.black,
    shadowOffset: { height: 2, width: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    zIndex: 100,
  },
  pill: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    gap: INDENTS.low,
    paddingHorizontal: INDENTS.medium,
    paddingVertical: INDENTS.low,
  },
  text: {
    color: COLORS.white,
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
})
