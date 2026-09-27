import { LinearGradient } from 'expo-linear-gradient'
import { gradientStyles } from './gradients'

// Non-interactive dark fades that keep the overlay controls readable against
// the artwork; `pointerEvents: 'none'` keeps every touch on the content below.
export const PlayerEdgeFades = () => (
  <>
    <LinearGradient
      colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0)']}
      style={[gradientStyles.topGradient, { pointerEvents: 'none' }]}
    />
    <LinearGradient
      colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.7)']}
      style={[gradientStyles.bottomGradient, { pointerEvents: 'none' }]}
    />
  </>
)
