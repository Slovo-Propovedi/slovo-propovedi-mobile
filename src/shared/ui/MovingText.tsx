import { useCallback, useState } from 'react'
import { Platform, type StyleProp, type TextStyle, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import TextTicker from 'react-native-text-ticker'
import { scheduleOnRN } from 'react-native-worklets'
import { HOLD_MS, shouldArmMarquee, useMarqueeClickGuard, useNativeDragGuard } from './marquee-text'
import { useTheme } from './theme/ThemeContext/useTheme'

interface MovingTextProps {
  style?: StyleProp<TextStyle>
  testID?: string
  text: string
}

export const MovingText = ({ style, testID, text }: MovingTextProps) => {
  const { currentTheme } = useTheme()
  const [armed, setArmed] = useState(false)
  const [prevText, setPrevText] = useState(text)
  const didDrag = useSharedValue(false)
  const clickGuardRef = useMarqueeClickGuard(didDrag)
  const dragGuardRef = useNativeDragGuard()

  // The container view hosts both web-only DOM guards: the click guard swallows
  // the post-drag click, the native-drag guard blocks the browser's HTML5
  // `dragstart` that would hijack mouse drags on `<img>` descendants.
  const containerRef = useCallback(
    (instance: unknown) => {
      clickGuardRef(instance)
      dragGuardRef(instance)
    },
    [clickGuardRef, dragGuardRef],
  )

  // A new title is static until the next real drag (parity with MarqueeText).
  // Reset during render so the remounted ticker never starts with the old arm.
  if (text !== prevText) {
    setPrevText(text)
    setArmed(false)
  }

  const pan = Gesture.Pan().shouldCancelWhenOutside(false)

  // Desktop users press-and-drag immediately; long-press activation loses the
  // race with touch-slop failure (PanGestureHandler.tryBegin cancels activation
  // when the pointer moves > touch slop within the hold window). minDistance(10)
  // activates on the first real movement — no 250ms wait before scrubbing.
  // Native keeps the long-press so a slow click still navigates.
  if (Platform.OS === 'web') pan.minDistance(10).failOffsetY([-14, 14])
  else pan.activateAfterLongPress(HOLD_MS)

  pan
    .onBegin(() => {
      'worklet'
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value reset in worklet
      didDrag.value = false
    })
    .onStart(() => {
      'worklet'
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value set in worklet
      didDrag.value = true
    })
    .onEnd(e => {
      'worklet'
      const isArmed = shouldArmMarquee(e.translationX)
      if (isArmed) scheduleOnRN(setArmed, true)
      // A slow click (held ≥ HOLD_MS, zero movement) activates the pan but is
      // not a drag: keep the click alive so the parent pressable navigates.
      // eslint-disable-next-line react-hooks/immutability -- Reanimated shared value: intentional .value reset in worklet
      if (!isArmed) didDrag.value = false
    })

  // Every text goes through the gated ticker: the ticker itself is inert for
  // non-overflowing text (react-native-text-ticker measures contentFits and
  // skips the animation, renders no duplicate copy), so no length-based split
  // is needed. A short-but-wide title must marquee exactly like a long one.
  return (
    <View ref={containerRef} collapsable={false}>
      <GestureDetector gesture={pan}>
        <TextTicker
          loop
          bounce={false}
          testID={testID}
          scrollSpeed={30}
          numberOfLines={1}
          repeatSpacer={50}
          marqueeDelay={2000}
          isInteraction={false}
          marqueeOnMount={armed}
          key={`${text}-${armed}`}
          style={[{ color: currentTheme.text }, style]}
        >
          {text}
        </TextTicker>
      </GestureDetector>
    </View>
  )
}
