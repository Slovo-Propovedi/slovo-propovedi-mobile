import { useEffect } from 'react'
import { StyleSheet, View } from 'react-native'
import { cancelAnimation, useAnimatedProps, useSharedValue } from 'react-native-reanimated'
import Svg, { Defs, RadialGradient, Stop } from 'react-native-svg'
import { useTheme } from 'shared/ui/theme'
import {
  ACCENT_KEYS,
  accentColor,
  breatheLoop,
  ccwAngle,
  CENTER,
  cwAngle,
  type GlowLayerAnimated,
  LAYER_BASE,
  LAYER_CCW,
  LAYER_CW,
  RING_SIZE,
  spinCcwLoop,
  spinCwLoop,
} from './glowConfig'
import { GlowLayer } from './GlowLayer'

export const GlowRing = ({ isPlaying }: { isPlaying: boolean }) => {
  const { currentTheme } = useTheme()
  const primary = String(currentTheme.primary)

  const cw = useSharedValue(0)
  const ccw = useSharedValue(0)
  const breathe = useSharedValue(0)

  useEffect(() => {
    const stop = () => {
      cancelAnimation(cw)
      cancelAnimation(ccw)
      cancelAnimation(breathe)
    }

    // «Постоянно в движении когда на паузе» (issue #72): играет — свечение замирает.
    if (isPlaying) return stop

    cw.value = spinCwLoop()
    ccw.value = spinCcwLoop()
    breathe.value = breatheLoop()

    return stop
  }, [isPlaying, breathe, ccw, cw])

  const cwProps = useAnimatedProps<GlowLayerAnimated>(() => ({
    transform: [{ rotate: `${cwAngle(cw.value)}deg` }, { scale: 1 + breathe.value * 0.08 }],
  }))
  const ccwProps = useAnimatedProps<GlowLayerAnimated>(() => ({
    opacity: 0.55 + (1 - breathe.value) * 0.45,
    transform: [{ rotate: `${ccwAngle(ccw.value)}deg` }, { scale: 1.04 - breathe.value * 0.06 }],
  }))
  const baseProps = useAnimatedProps<GlowLayerAnimated>(() => ({
    opacity: 0.7 + breathe.value * 0.3,
  }))

  const viewBox = `${-CENTER} ${-CENTER} ${RING_SIZE} ${RING_SIZE}`

  return (
    <View testID='glow-ring' style={styles.container}>
      <Svg width={RING_SIZE} viewBox={viewBox} height={RING_SIZE}>
        <Defs>
          {ACCENT_KEYS.map(accent => (
            <RadialGradient r='50%' cx='50%' cy='50%' key={`${accent}`} id={`glow${accent}`}>
              <Stop offset='0%' stopOpacity={0.9} stopColor={accentColor(accent, primary)} />
              <Stop offset='55%' stopOpacity={0.3} stopColor={accentColor(accent, primary)} />
              <Stop offset='100%' stopOpacity={0} stopColor={accentColor(accent, primary)} />
            </RadialGradient>
          ))}
        </Defs>
        <GlowLayer blobs={LAYER_BASE} animatedProps={baseProps} />
        <GlowLayer blobs={LAYER_CW} animatedProps={cwProps} />
        <GlowLayer blobs={LAYER_CCW} animatedProps={ccwProps} />
      </Svg>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    bottom: 0,
    justifyContent: 'center',
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
  },
})
