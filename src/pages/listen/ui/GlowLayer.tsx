import { type ComponentProps } from 'react'
import Animated from 'react-native-reanimated'
import { Circle, G } from 'react-native-svg'
import { type Blob, BLOB_R, type GlowLayerAnimated, ORBIT } from './glowConfig'

const AnimatedG = Animated.createAnimatedComponent(G)

interface GlowLayerProps {
  animatedProps: Partial<GlowLayerAnimated>
  blobs: Blob[]
}

// Один вращающийся слой свечения — группа `<G>` с набором мягких клякс.
// Координаты клякс отсчитываются от центра холста (0, 0) — за центрирование
// отвечает `viewBox` в GlowRing, поэтому rotate/scale группы идут вокруг центра.
export const GlowLayer = ({ animatedProps, blobs }: GlowLayerProps) => (
  // Каст: типы reanimated для `animatedProps` SVG-компонентов не моделируют
  // transform-массив, хотя рантайм его принимает.
  <AnimatedG animatedProps={animatedProps as ComponentProps<typeof AnimatedG>['animatedProps']}>
    {blobs.map(([angle, accent, sizeScale, opacityScale]) => {
      const rad = (angle * Math.PI) / 180
      return (
        <Circle
          key={angle}
          opacity={opacityScale}
          r={BLOB_R * sizeScale}
          cx={ORBIT * Math.cos(rad)}
          cy={ORBIT * Math.sin(rad)}
          fill={`url(#glow${accent})`}
        />
      )
    })}
  </AnimatedG>
)
