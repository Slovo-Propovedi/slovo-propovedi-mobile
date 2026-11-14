import { memo } from 'react'
import { Platform, type StyleProp, type TextStyle, type ViewStyle } from 'react-native'
import { GestureDetector } from 'react-native-gesture-handler'
import { useSharedValue } from 'react-native-reanimated'
import { type MarqueeCycle } from './marquee-cycle'
import { MarqueeMeasurerSlot } from './marquee-measurer-slot'
import { MarqueeTextRow } from './marquee-text-row'
import { MarqueeTextSkeleton } from './skeleton'
import { EdgeFadeContainer } from './text-edge-fade'
import { useMarqueeAnimation } from './useMarqueeAnimation'
import { useMarqueeContainerRef } from './useMarqueeContainerRef'
import { useMarqueeGesture } from './useMarqueeGesture'
import { useMarqueeMeasurement } from './useMarqueeMeasurement'

export interface MarqueeTextProps {
  /** Arms the loop immediately on overflow (player titles); others stay drag-gated. */
  autoStart?: boolean
  centerWhenStatic?: boolean
  /** Fades the trailing clip edge while the text overflows (no solid background needed). */
  fadeEdge?: boolean
  /** When set, this row has no clock: it follows the leader's published cycle. */
  followCycle?: MarqueeCycle
  /** When set, this row publishes its own cycle for followers. */
  publishCycle?: MarqueeCycle
  style?: StyleProp<ViewStyle>
  testID?: string
  text: string
  textStyle?: StyleProp<TextStyle>
}

export const MarqueeText = memo(function MarqueeTextComponent({
  autoStart = false,
  centerWhenStatic = false,
  fadeEdge = false,
  followCycle,
  publishCycle,
  style,
  testID,
  text,
  textStyle,
}: MarqueeTextProps) {
  const isWeb = Platform.OS === 'web'
  const didDrag = useSharedValue(false)
  const containerRef = useMarqueeContainerRef(didDrag)
  const {
    applyTextWidth,
    containerWidth,
    handleContainerFallbackLayout,
    handleContainerLayout,
    maxOffset,
    measurerAttempt,
    needsMarquee,
    needsRepeat,
    textWidth,
  } = useMarqueeMeasurement(text)

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
      publishCycle,
      followCycle,
    )

  const pan = useMarqueeGesture({
    clockPaused,
    didDrag,
    marqueeArmed,
    maxOffset,
    startIdleMarquee,
    startX,
    translateX,
  })

  if (!text) return null

  const alignSelf = needsRepeat ? 'flex-start' : centerWhenStatic ? 'center' : 'flex-start'

  const row = (
    <MarqueeTextRow
      text={text}
      isWeb={isWeb}
      alignSelf={alignSelf}
      textStyle={textStyle}
      needsRepeat={needsRepeat}
      needsMarquee={needsMarquee}
      animatedStyle={animatedStyle}
    />
  )

  // alignSelf:'stretch' overrides a parent's alignItems:'center'; without it the
  // container shrink-wraps to the row's explicit width (maxOffset=0, overflow).
  return (
    <EdgeFadeContainer
      testID={testID}
      enabled={fadeEdge}
      containerRef={containerRef}
      fading={fadeEdge && needsRepeat}
      onLayout={handleContainerLayout}
      fallbackOnLayout={handleContainerFallbackLayout}
      style={[{ alignSelf: 'stretch', overflow: 'hidden' }, style]}
    >
      {/* A follower only displays; scrubbing its leader-owned phase would desync. */}
      {followCycle ? row : <GestureDetector gesture={pan}>{row}</GestureDetector>}
      <MarqueeMeasurerSlot
        text={text}
        isWeb={isWeb}
        textStyle={textStyle}
        attempt={measurerAttempt}
        onTextWidth={applyTextWidth}
      />
    </EdgeFadeContainer>
  )
})

MarqueeText.displayName = 'MarqueeText'

Object.assign(MarqueeText, { Skeleton: MarqueeTextSkeleton })
