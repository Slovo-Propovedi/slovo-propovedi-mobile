import { View } from 'react-native'
import { WEB_EDGE_FADE_STYLE } from '../marquee-styles'
import { type EdgeFadeContainerProps } from './types'

// Web has no MaskedView. The container itself carries a CSS alpha mask instead:
// RNW passes `maskImage` through and prefixes it for WebKit. `enabled` needs no
// branch here — only `fading` decides whether the gradient mask is applied.
export const EdgeFadeContainer = ({
  children,
  containerRef,
  fading,
  onLayout,
  style,
  testID,
}: EdgeFadeContainerProps) => (
  <View
    testID={testID}
    ref={containerRef}
    onLayout={onLayout}
    style={fading ? [style, WEB_EDGE_FADE_STYLE] : style}
  >
    {children}
  </View>
)
