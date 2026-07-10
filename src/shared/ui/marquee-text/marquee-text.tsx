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
  const [started, setStarted] = useState(false)
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

  const handleContainerLayout = (e: LayoutChangeEvent) => {
    containerWidth.value = e.nativeEvent.layout.width
    if (!started && containerWidth.value > 0 && textWidth.value > 0) {
      setStarted(true)
      scheduleOnUI(startIdleMarquee)
    }
  }

  const handleTextLayout = (e: TextLayoutEvent) => {
    const lines = e.nativeEvent.lines
    textWidth.value = lines.length > 0 ? lines[0].width : 0
    if (!started && containerWidth.value > 0 && textWidth.value > 0) {
      setStarted(true)
      scheduleOnUI(startIdleMarquee)
    }
  }

  if (!text) return null

  return (
    <View testID={testID} onLayout={handleContainerLayout} style={[{ overflow: 'hidden' }, style]}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[animatedStyle, { alignSelf: 'flex-start', flexDirection: 'row' }]}>
          <Text numberOfLines={1} style={textStyle}>
            {text}
          </Text>
          <View style={{ width: REPEAT_SPACER }} />
          <Text numberOfLines={1} style={textStyle}>
            {text}
          </Text>
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

export default MarqueeText
