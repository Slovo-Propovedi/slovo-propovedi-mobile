import { makeMutable } from 'react-native-reanimated'

// The islands above are translucent glass, so the tucked pill must fade out
// after the slide; 180 ms reads as one motion rather than a second step.
export const MINI_TUCK_FADE_MS = 180

/**
 * 1→0 opacity of the tucking mini pill. Module-level because the shade's pill
 * cutout reads the exact same value: while the glass fades out, its cutout
 * loses strength with it, and a fully faded pill leaves no stale gradient gap.
 */
export const miniPillOpacitySv = makeMutable(1)
