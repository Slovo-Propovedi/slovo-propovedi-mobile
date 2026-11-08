import { BAR_CIRCLE_SIZE_EXPANDED } from 'shared/ui/layout'
import { LightTheme, MIN_TOUCH_TARGET } from 'shared/ui/theme'
import {
  createMiniStyles,
  MINI_ARTWORK_SIZE,
  MINI_CONTENT_SIDE_INSET,
  MINI_EXPANDED_TRANSPORT_RIGHT_INSET,
  MINI_PLAY_HIT_SLOP,
} from './miniStyles'

const styles = createMiniStyles(LightTheme, true)

describe('mini player horizontal alignment', () => {
  test('expanded bar: the transport glyph shares the search circle axis', () => {
    // The search circle sits flush with the row's inner right edge, which is
    // also the pill's right edge; its centre is therefore half its diameter
    // inside that edge. The transport box is artwork-sized, so its glyph centre
    // sits half that width inside the pill: 38 − 20 = 18dp.
    expect(BAR_CIRCLE_SIZE_EXPANDED / 2 - MINI_ARTWORK_SIZE / 2).toBe(18)
    expect(MINI_EXPANDED_TRANSPORT_RIGHT_INSET).toBe(18)
    expect(styles.miniContainer.paddingRight).toBe(MINI_EXPANDED_TRANSPORT_RIGHT_INSET)
  })

  test('expanded bar: the artwork keeps the compact left inset', () => {
    expect(MINI_CONTENT_SIDE_INSET).toBe(8)
    expect(styles.miniContainer.paddingLeft).toBe(MINI_CONTENT_SIDE_INSET)
  })

  test('collapsed bar: the right gap mirrors the artwork gap', () => {
    // The collapsed pill sits inside the row away from the search circle, so
    // both visible edges keep the same compact inset — the pill reads symmetric.
    expect(styles.miniContainerCollapsed.paddingRight).toBe(styles.miniContainer.paddingLeft)
    expect(styles.miniContainerCollapsed.paddingRight).toBe(8)
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
