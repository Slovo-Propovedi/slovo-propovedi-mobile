import { Platform, type StyleProp, Text, type TextStyle, View, type ViewStyle } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { useAnimatedReaction, useSharedValue } from 'react-native-reanimated'
import { createMarqueeGesture } from './createMarqueeGesture'
import { NATIVE_MEASURER_STYLE, WEB_MEASURER_STYLE, WEB_TEXT_STYLE } from './marquee-styles'
import { REPEAT_SPACER } from './marquee-utils'
import { MarqueeTextSkeleton } from './skeleton'
import { useMarqueeAnimation } from './useMarqueeAnimation'
import { useMarqueeContainerRef } from './useMarqueeContainerRef'
import { useMarqueeMeasurement } from './useMarqueeMeasurement'

export interface MarqueeTextProps {
  /** Arms the loop immediately on overflow (player titles); others stay drag-gated. */
  autoStart?: boolean
  centerWhenStatic?: boolean
  style?: StyleProp<ViewStyle>
  testID?: string
  text: string
  textStyle?: StyleProp<TextStyle>
}

export const MarqueeText = ({
  autoStart = false,
  centerWhenStatic = false,
  style,
  testID,
  text,
  textStyle,
}: MarqueeTextProps) => {
  const isWeb = Platform.OS === 'web'
  const didDrag = useSharedValue(false)
  const containerRef = useMarqueeContainerRef(didDrag)
  const {
    containerWidth,
    handleContainerLayout,
    handleMeasurerLayout,
    handleTextLayout,
    maxOffset,
    needsMarquee,
    needsRepeat,
    textWidth,
  } = useMarqueeMeasurement()

  const { animatedStyle, clockPaused, marqueeArmed, startIdleMarquee, startX, translateX } =
    useMarqueeAnimation(
      containerWidth,
      textWidth,
      needsMarquee,
      text,
      isWeb,
      centerWhenStatic,
      autoStart,
      needsRepeat,
    )

  useAnimatedReaction(
    () => ({ container: containerWidth.value, text: textWidth.value }),
    (current, previous) => {
      if (current.container !== previous?.container || current.text !== previous?.text)
        startIdleMarquee()
    },
  )

  const pan = createMarqueeGesture(
    translateX,
    startX,
    maxOffset,
    startIdleMarquee,
    didDrag,
    marqueeArmed,
    clockPaused,
  )

  if (!text) return null

  const alignSelf = needsRepeat ? 'flex-start' : centerWhenStatic ? 'center' : 'flex-start'
  // @ts-expect-error - web-only measurer width 'max-content' is not in RN DimensionValue
  const measurerStyle: StyleProp<TextStyle> = isWeb ? WEB_MEASURER_STYLE : NATIVE_MEASURER_STYLE
  // @ts-expect-error - web-only whiteSpace is not in RN TextStyle
  const visibleTextStyle: StyleProp<TextStyle> = isWeb ? [textStyle, WEB_TEXT_STYLE] : textStyle

  return (
    <View
      testID={testID}
      ref={containerRef}
      onLayout={handleContainerLayout}
      style={[{ overflow: 'hidden' }, style]}
    >
      <GestureDetector gesture={pan}>
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
              <Text
                ellipsizeMode='clip'
                style={visibleTextStyle}
                numberOfLines={isWeb ? undefined : 1}
              >
                {text}
              </Text>
            </>
          )}
        </Animated.View>
      </GestureDetector>
      <Text
        pointerEvents='none'
        style={[textStyle, measurerStyle]}
        onLayout={isWeb ? handleMeasurerLayout : undefined}
        onTextLayout={isWeb ? undefined : handleTextLayout}
      >
        {text}
      </Text>
    </View>
  )
}

MarqueeText.Skeleton = MarqueeTextSkeleton
