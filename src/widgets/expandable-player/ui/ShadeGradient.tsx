import { Defs, LinearGradient, Mask, Rect, Stop, Svg } from 'react-native-svg'
import { type ShadeStop } from '../lib/getShadeColors'
import { SHADE_HOLE_KEYS, type ShadeHoleLayout } from '../lib/getShadeHoles'
import { type ShadeMorphSources } from '../model/useShadeGeometry'
import { AnimatedShadeHole } from './AnimatedShadeHole'

const GRADIENT_ID = 'bottom-chrome-shade-gradient'
const MASK_ID = 'bottom-chrome-shade-holes'

/**
 * The shade itself: one vertical gradient with the chrome footprints masked
 * out, so the glass islands sit on the page rather than on the gradient. The
 * mask has one FIXED animated rect per slot — it never remounts mid-morph. The
 * Svg gets explicit viewport dims (`screenWidth` × `svgHeight`, the expanded-max
 * shade height) instead of percentages: react-native-svg on Android freezes
 * percentage sizing at the first measure, so the paint stayed short after the
 * box grew. The box clips the overhang; percent children resolve against this
 * explicit viewport. Stop alpha rides `stopOpacity`: react-native-svg drops
 * `stopColor` alpha on native, and only `stopOpacity` reaches Android.
 * @param root0 - Gradient props.
 * @param root0.colors - Gradient stops (opaque tint + alpha), top to bottom.
 * @param root0.layout - Static shade box / chrome mounting inputs.
 * @param root0.locations - Stop positions, matching `colors`.
 * @param root0.screenWidth - Viewport width in dp.
 * @param root0.sources - Shared morph progress values of the cutouts.
 * @param root0.svgHeight - Expanded-max shade height in dp.
 */
export const ShadeGradient = ({
  colors,
  layout,
  locations,
  screenWidth,
  sources,
  svgHeight,
}: {
  colors: readonly ShadeStop[]
  layout: ShadeHoleLayout
  locations: readonly number[]
  screenWidth: number
  sources: ShadeMorphSources
  svgHeight: number
}) => (
  <Svg height={svgHeight} width={screenWidth} testID='bar-backdrop-shade-svg'>
    <Defs>
      <LinearGradient x1={0} y1={0} x2={0} y2={1} id={GRADIENT_ID}>
        {colors.map((stop, index) => (
          <Stop
            stopColor={stop.color}
            offset={locations[index]}
            stopOpacity={stop.opacity}
            key={`${index}-${String(locations[index])}`}
          />
        ))}
      </LinearGradient>
      <Mask id={MASK_ID}>
        <Rect x={0} y={0} width='100%' fill='white' height='100%' />
        {SHADE_HOLE_KEYS.map(slot => (
          <AnimatedShadeHole key={slot} slot={slot} layout={layout} sources={sources} />
        ))}
      </Mask>
    </Defs>
    <Rect
      x={0}
      y={0}
      width='100%'
      height='100%'
      mask={`url(#${MASK_ID})`}
      fill={`url(#${GRADIENT_ID})`}
    />
  </Svg>
)
