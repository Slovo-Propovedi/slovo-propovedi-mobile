import { BAR_CIRCLE_SIZE, BAR_CIRCLE_SIZE_EXPANDED, TAB_BAR_ISLAND_HEIGHT } from 'shared/ui/layout'
import {
  FONT_SIZES,
  INDENTS,
  LightTheme,
  MIN_TOUCH_TARGET,
  PLAYER_SIZES,
  RADIUSES,
} from 'shared/ui/theme'
import {
  createMiniStyles,
  MINI_ARTWORK_SIZE,
  MINI_CONTENT_SIDE_INSET,
  MINI_EXPANDED_TRANSPORT_RIGHT_INSET,
  MINI_PLAY_HIT_SLOP,
} from './miniStyles'

const styles = createMiniStyles(LightTheme)

describe('mini player horizontal alignment', () => {
  test('expanded bar: the transport glyph shares the search circle axis', () => {
    // The search circle sits flush with the row's inner right edge, which is
    // also the pill's right edge; its centre is therefore half its diameter
    // inside that edge. The transport box is artwork-sized, so its glyph centre
    // sits half that width inside the pill: 34 − 18 = 16dp.
    expect(BAR_CIRCLE_SIZE_EXPANDED / 2 - MINI_ARTWORK_SIZE / 2).toBe(16)
    expect(MINI_EXPANDED_TRANSPORT_RIGHT_INSET).toBe(16)
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

describe('mini player vertical alignment', () => {
  test('the pill is slimmer than the row circles (Issue #153)', () => {
    // Apple Music keeps the mini player lower than the tab/search circles; the
    // collapsed row bottom-aligns the slimmer pill with the islands.
    expect(PLAYER_SIZES.miniPlayerHeight).toBeLessThan(TAB_BAR_ISLAND_HEIGHT)
    expect(PLAYER_SIZES.miniPlayerHeight).toBeLessThan(BAR_CIRCLE_SIZE)
    expect(styles.miniContainer.height).toBe(PLAYER_SIZES.miniPlayerHeight)
  })

  test('the pill host uses the shared full-round radius', () => {
    // The platform clamps a full-round radius to min(w, h) / 2, so the pill host
    // stays a strict half-cylinder at any height without a per-surface radius
    // constant.
    expect(styles.miniContainer.borderRadius).toBe(RADIUSES.round)
  })
})

describe('mini player typography', () => {
  test('both lines use the large theme size so they read in the slimmer pill', () => {
    // The pill matches Apple Music's mini player, whose two lines are noticeably
    // larger than body copy at the same device; in the slim 48dp pill (Issue
    // #153) they take the lg step of the theme scale.
    expect(styles.miniTrackTitle.fontSize).toBe(FONT_SIZES.lg)
    expect(styles.miniPlaylistName.fontSize).toBe(FONT_SIZES.lg)
    expect(FONT_SIZES.lg).toBeGreaterThan(FONT_SIZES.base)
  })

  test('two lines at the new size still fit the pill height', () => {
    // Two lines at React Native's default 1.2 line box plus the subtitle gap stay
    // inside the pill, so the taller type needs no layout compensation.
    const textBlock = 2 * FONT_SIZES.lg * 1.2 + styles.miniPlaylistName.marginTop

    expect(textBlock).toBeLessThanOrEqual(PLAYER_SIZES.miniPlayerHeight)
  })
})
