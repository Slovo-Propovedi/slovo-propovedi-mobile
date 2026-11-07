import { LightTheme, MIN_TOUCH_TARGET } from 'shared/ui/theme'
import {
  createMiniStyles,
  MINI_ARTWORK_SIZE,
  MINI_CONTENT_SIDE_INSET,
  MINI_PLAY_HIT_SLOP,
} from './miniStyles'

const styles = createMiniStyles(LightTheme, true)

describe('mini player horizontal symmetry', () => {
  test('artwork and transport controls share one symmetric side inset', () => {
    // A single padding value is what makes "gap left of artwork" and "gap right
    // of the transport control" equal by construction.
    expect(styles.miniContainer.paddingHorizontal).toBe(MINI_CONTENT_SIDE_INSET)
  })

  test('the transport box matches the artwork box, so both float at the same edge inset', () => {
    expect(styles.miniCover.width).toBe(MINI_ARTWORK_SIZE)
    expect(styles.miniCover.height).toBe(MINI_ARTWORK_SIZE)
    expect(styles.miniControls.width).toBe(MINI_ARTWORK_SIZE)
    expect(styles.miniPlayButton.width).toBe(MINI_ARTWORK_SIZE)
    expect(styles.miniPlayButton.height).toBe(MINI_ARTWORK_SIZE)
  })

  test('the transport keeps a full touch target through hitSlop', () => {
    expect(MINI_ARTWORK_SIZE + MINI_PLAY_HIT_SLOP * 2).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET)

    // Inline min sizes override IconButton's 48dp base box, letting the visual
    // box shrink to the artwork size without shrinking the touch target.
    expect(styles.miniPlayButton.minHeight).toBe(MINI_ARTWORK_SIZE)
    expect(styles.miniPlayButton.minWidth).toBe(MINI_ARTWORK_SIZE)
  })
})
