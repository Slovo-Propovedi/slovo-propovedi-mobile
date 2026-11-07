import { type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native'
import Animated, { type AnimatedStyle } from 'react-native-reanimated'
import { WEB_TEXT_STYLE } from './marquee-styles'
import { REPEAT_SPACER } from './marquee-utils'

interface MarqueeTextRowProps {
  alignSelf: 'center' | 'flex-start'
  animatedStyle: AnimatedStyle<ViewStyle>
  isWeb: boolean
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
  needsRepeat,
  text,
  textStyle,
}: MarqueeTextRowProps) => {
  const visibleTextStyle: StyleProp<TextStyle> = isWeb ? [textStyle, WEB_TEXT_STYLE] : textStyle

  return (
    <Animated.View
      renderToHardwareTextureAndroid
      style={[animatedStyle, { alignSelf, flexDirection: 'row' }]}
    >
      <Text ellipsizeMode='clip' style={visibleTextStyle} numberOfLines={isWeb ? undefined : 1}>
        {text}
      </Text>
      {needsRepeat && (
        <>
          <View style={{ width: REPEAT_SPACER }} />
          <Text ellipsizeMode='clip' style={visibleTextStyle} numberOfLines={isWeb ? undefined : 1}>
            {text}
          </Text>
        </>
      )}
    </Animated.View>
  )
}
