import { useEffect, useState } from 'react'
import { type LayoutChangeEvent, StyleSheet, View } from 'react-native'
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated'
import Svg, { Path } from 'react-native-svg'
import { useTheme } from 'shared/ui/theme'

const WAVE_LENGTH = 90
const WAVE_DURATION_MS = 2000
const STROKE_WIDTH = 15
const SAMPLE_STEP = 2

const buildWavePath = (waveWidth: number, containerHeight: number): string => {
  // Амплитуда выведена из высоты контейнера, чтобы пики (с учётом полштриха из-за
  // strokeLinecap='round') никогда не выходили за его границы: amplitude + STROKE_WIDTH / 2 = containerHeight / 2 - 1.
  const midY = containerHeight / 2
  const amplitude = Math.max(0, (containerHeight - STROKE_WIDTH) / 2 - 1)
  const points: string[] = []

  for (let x = 0; x <= waveWidth; x += SAMPLE_STEP) {
    const y = midY + amplitude * Math.sin((2 * Math.PI * x) / WAVE_LENGTH)
    points.push(`${x.toFixed(1)} ${y.toFixed(1)}`)
  }

  return `M ${points.join(' L ')}`
}

export const PlayingWave = () => {
  const { currentTheme } = useTheme()
  const [containerWidth, setContainerWidth] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)
  const translateX = useSharedValue(0)

  const waveWidth = containerWidth + WAVE_LENGTH

  const handleContainerLayout = (event: LayoutChangeEvent) => {
    setContainerWidth(event.nativeEvent.layout.width)
    setContainerHeight(event.nativeEvent.layout.height)
  }

  useEffect(() => {
    translateX.value = withRepeat(
      withTiming(-WAVE_LENGTH, { duration: WAVE_DURATION_MS, easing: Easing.linear }),
      -1,
      false,
    )

    return () => cancelAnimation(translateX)
  }, [translateX])

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }))

  if (containerWidth === 0 || containerHeight === 0)
    return <View testID='playing-wave' style={styles.container} onLayout={handleContainerLayout} />

  const wavePath = buildWavePath(waveWidth, containerHeight)

  return (
    <View testID='playing-wave' style={styles.container} onLayout={handleContainerLayout}>
      <Animated.View
        testID='playing-wave-path'
        style={[styles.wave, { width: waveWidth }, animatedStyle]}
      >
        <Svg width='100%' height='100%' viewBox={`0 0 ${waveWidth} ${containerHeight}`}>
          <Path
            fill='none'
            d={wavePath}
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={STROKE_WIDTH}
            stroke={currentTheme.primary}
          />
        </Svg>
      </Animated.View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    overflow: 'hidden',
    width: '100%',
  },
  wave: {
    alignSelf: 'flex-start',
    height: '100%',
  },
})
