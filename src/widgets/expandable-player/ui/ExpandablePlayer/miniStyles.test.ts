import { BAR_CIRCLE_SIZE_EXPANDED } from 'shared/ui/layout'
import { FONT_SIZES, INDENTS, LightTheme, MIN_TOUCH_TARGET, PLAYER_SIZES } from 'shared/ui/theme'
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

  test('expanded bar: the artwork keeps the relaxed left inset', () => {
    expect(INDENTS.medium).toBe(16)
    expect(MINI_CONTENT_SIDE_INSET).toBe(16)
    expect(styles.miniContainer.paddingLeft).toBe(MINI_CONTENT_SIDE_INSET)
  })

  test('collapsed bar: the right gap mirrors the artwork gap', () => {
    // The collapsed pill sits inside the row away from the search circle, so
    // both visible edges keep the same relaxed inset — the pill reads symmetric
    // with generous air before the artwork and after the transport.
    expect(styles.miniContainerCollapsed.paddingRight).toBe(styles.miniContainer.paddingLeft)
    expect(styles.miniContainerCollapsed.paddingRight).toBe(16)
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

describe('mini player typography', () => {
  test('both lines step up one theme size above body text', () => {
    // The pill matches Apple Music's mini player, whose two lines are noticeably
    // larger than body copy at the same device: one step on the theme scale.
    expect(styles.miniTrackTitle.fontSize).toBe(FONT_SIZES.md)
    expect(styles.miniPlaylistName.fontSize).toBe(FONT_SIZES.md)
    expect(FONT_SIZES.md).toBeGreaterThan(FONT_SIZES.base)
  })

  test('two lines at the new size still fit the pill height', () => {
    // Two lines at React Native's default 1.2 line box plus the subtitle gap stay
    // inside the 60dp pill, so the taller type needs no layout compensation.
    const textBlock = 2 * FONT_SIZES.md * 1.2 + styles.miniPlaylistName.marginTop

    expect(textBlock).toBeLessThanOrEqual(PLAYER_SIZES.miniPlayerHeight)
  })
})
