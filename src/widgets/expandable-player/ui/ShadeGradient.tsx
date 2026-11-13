import { Defs, LinearGradient, Mask, Rect, Stop, Svg } from 'react-native-svg'
import { type ShadeHole } from '../lib/shadeRow'

const GRADIENT_ID = 'bottom-chrome-shade-gradient'
const MASK_ID = 'bottom-chrome-shade-holes'

/**
 * The shade itself: one vertical gradient with the settled chrome footprints
 * masked out, so the glass islands sit on the page rather than on the gradient.
 * Percent sizing keeps the gradient and the mask stretched over the shade box
 * while its height animates.
 * @param root0 - Gradient props.
 * @param root0.colors - Gradient stops, top to bottom.
 * @param root0.holes - Rounded footprints to cut out of the shade.
 * @param root0.locations - Stop positions, matching `colors`.
 */
export const ShadeGradient = ({
  colors,
  holes,
  locations,
}: {
  colors: readonly string[]
  holes: ShadeHole[]
  locations: readonly number[]
}) => (
  <Svg width='100%' height='100%' testID='bar-backdrop-shade-svg'>
    <Defs>
      <LinearGradient x1={0} y1={0} x2={0} y2={1} id={GRADIENT_ID}>
        {colors.map((color, index) => (
          <Stop
            stopColor={color}
            offset={locations[index]}
            key={`${index}-${String(locations[index])}`}
          />
        ))}
      </LinearGradient>
      <Mask id={MASK_ID}>
        <Rect x={0} y={0} width='100%' fill='white' height='100%' />
        {holes.map(hole => (
          <Rect
            x={hole.x}
            y={hole.y}
            fill='black'
            width={hole.width}
            height={hole.height}
            rx={hole.height / 2}
            key={`${hole.x}-${hole.y}-${hole.width}`}
          />
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
