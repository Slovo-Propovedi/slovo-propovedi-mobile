import { makeMutable } from 'react-native-reanimated'

// The islands above are translucent glass, so the tucked pill must fade out
// after the slide; 180 ms reads as one motion rather than a second step.
export const MINI_TUCK_FADE_MS = 180

/**
 * 1→0 opacity of the tucking mini pill. Module-level shared value so the glass
 * opacity and any other reader follow one value instead of owning separate
 * `withTiming`s that could micro-drift.
 */
export const miniPillOpacitySv = makeMutable(1)
