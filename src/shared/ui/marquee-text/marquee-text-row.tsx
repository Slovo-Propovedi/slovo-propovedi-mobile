import { type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native'
import Animated, {
  type AnimatedStyle,
  type SharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated'
import { WEB_TEXT_STYLE } from './marquee-styles'
import { REPEAT_SPACER } from './marquee-utils'

interface MarqueeTextRowProps {
  alignSelf: 'center' | 'flex-start'
  animatedStyle: AnimatedStyle<ViewStyle>
  isWeb: boolean
  needsMarquee: SharedValue<boolean>
  needsRepeat: boolean
  text: string
  textStyle: StyleProp<TextStyle>
}

// The scrolling row: one visible copy plus, while overflowing, a spacer and a
// duplicate that slides in exactly as the first copy leaves the clip box.
export const MarqueeTextRow = ({
  alignSelf,
  animatedStyle,
  isWeb,
  needsMarquee,
  needsRepeat,
  text,
  textStyle,
}: MarqueeTextRowProps) => {
  const visibleTextStyle: StyleProp<TextStyle> = isWeb ? [textStyle, WEB_TEXT_STYLE] : textStyle

  // `needsRepeat` is JS state and can lag the UI-thread width animation, so the
  // duplicate is gated by the geometric flag the UI thread already has: it may
  // stay mounted for a frame or two, but it is never visible once the text fits.
  const repeatVisibilityStyle = useAnimatedStyle(() => ({
    opacity: needsMarquee.value ? 1 : 0,
  }))

  return (
    <Animated.View
      renderToHardwareTextureAndroid
      style={[animatedStyle, { alignSelf, flexDirection: 'row' }]}
    >
      <Text ellipsizeMode='clip' style={visibleTextStyle} numberOfLines={isWeb ? undefined : 1}>
        {text}
      </Text>
      {needsRepeat && (
        <Animated.View style={[repeatVisibilityStyle, { flexDirection: 'row' }]}>
          <View style={{ width: REPEAT_SPACER }} />
          <Text ellipsizeMode='clip' style={visibleTextStyle} numberOfLines={isWeb ? undefined : 1}>
            {text}
          </Text>
        </Animated.View>
      )}
    </Animated.View>
  )
}
