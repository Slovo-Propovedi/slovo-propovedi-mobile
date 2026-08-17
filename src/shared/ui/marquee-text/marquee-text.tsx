import { useState } from 'react'
import {
  type LayoutChangeEvent,
  type StyleProp,
  Text,
  type TextLayoutEvent,
  type TextStyle,
  View,
  type ViewStyle,
} from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import Animated, { useDerivedValue, useSharedValue } from 'react-native-reanimated'
import { scheduleOnUI } from 'react-native-worklets'
import { createMarqueeGesture } from './createMarqueeGesture'
import { REPEAT_SPACER, shouldMarquee } from './marquee-utils'
import { MarqueeTextSkeleton } from './skeleton'
import { useMarqueeAnimation } from './useMarqueeAnimation'

export interface MarqueeTextProps {
  animationThreshold?: number
  style?: StyleProp<ViewStyle>
  testID?: string
  text: string
  textStyle?: StyleProp<TextStyle>
}

export const MarqueeText = ({
  animationThreshold = 0,
  style,
  testID,
  text,
  textStyle,
}: MarqueeTextProps) => {
  const [needsRepeat, setNeedsRepeat] = useState(false)

  const containerWidth = useSharedValue(0)
  const textWidth = useSharedValue(0)
  const maxOffset = useDerivedValue(() => Math.max(0, textWidth.value - containerWidth.value))
  const needsMarquee = useDerivedValue(() =>
    shouldMarquee((text ?? '').length, maxOffset.value, animationThreshold),
  )

  const { animatedStyle, startIdleMarquee, startX, translateX } = useMarqueeAnimation(
    containerWidth,
    textWidth,
    needsMarquee,
    text,
  )

  const pan = createMarqueeGesture(translateX, startX, maxOffset, startIdleMarquee)

  const evaluateNeedsRepeat = (containerW: number, textW: number) => {
    const next =
      containerW > 0 &&
      textW > 0 &&
      shouldMarquee(text.length, Math.max(0, textW - containerW), animationThreshold)
    setNeedsRepeat(next)
  }

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value mutation in layout callback
    containerWidth.value = e.nativeEvent.layout.width
    evaluateNeedsRepeat(containerWidth.value, textWidth.value)
    scheduleOnUI(startIdleMarquee)
  }

  const handleTextLayout = (e: TextLayoutEvent) => {
    const lines = e.nativeEvent.lines
    // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value mutation in layout callback
    textWidth.value = lines.length > 0 ? lines[0].width : 0
    evaluateNeedsRepeat(containerWidth.value, textWidth.value)
    scheduleOnUI(startIdleMarquee)
  }

  if (!text) return null

  return (
    <View testID={testID} onLayout={handleContainerLayout} style={[{ overflow: 'hidden' }, style]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[animatedStyle, { alignSelf: 'flex-start', flexDirection: 'row' }]}>
          <Text numberOfLines={1} style={textStyle}>
            {text}
          </Text>
          {needsRepeat && (
            <>
              <View style={{ width: REPEAT_SPACER }} />
              <Text numberOfLines={1} style={textStyle}>
                {text}
              </Text>
            </>
          )}
        </Animated.View>
      </GestureDetector>
      <Text
        pointerEvents='none'
        onTextLayout={handleTextLayout}
        style={[textStyle, { left: 0, opacity: 0, position: 'absolute', top: 0, width: 2000 }]}
      >
        {text}
      </Text>
    </View>
  )
}

MarqueeText.Skeleton = MarqueeTextSkeleton
