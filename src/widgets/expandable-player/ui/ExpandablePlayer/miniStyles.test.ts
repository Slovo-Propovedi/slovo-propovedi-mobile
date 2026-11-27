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
  MINI_WIDE_ARTWORK_SIZE,
  MINI_WIDE_CONTROL_GAP,
} from './miniStyles'
import {
  createWideMiniStyles,
  MINI_WIDE_ACTION_BOX_SIZE,
  MINI_WIDE_ACTION_HIT_SLOP,
  MINI_WIDE_ACTION_ICON_SIZE,
  WIDE_SKIP_GLYPH_SIZE,
} from './miniWideStyles'

const styles = createMiniStyles(LightTheme)
const wideStyles = createMiniStyles(LightTheme, true)
const wideToolbarStyles = createWideMiniStyles(LightTheme)

// Reads the wide row's track-info leading inset defensively: the seam test
// drives that style into existence instead of depending on its shape.
const getTrackInfoLeadingInset = (toolbarStyles: object) => {
  const { trackInfo } = toolbarStyles as { trackInfo?: { marginLeft?: number } }

  return trackInfo?.marginLeft ?? 0
}

describe('mini player horizontal alignment', () => {
  test('expanded bar: the transport glyph shares the search circle axis', () => {
    // The search circle sits flush with the row's inner right edge, which is
    // also the pill's right edge; its centre is therefore half its diameter
    // inside that edge. The transport box is artwork-sized, so its glyph centre
    // sits half that width inside the pill: 34 − 18 = 16dp.
    const expectedInset = BAR_CIRCLE_SIZE_EXPANDED / 2 - MINI_ARTWORK_SIZE / 2
    expect(expectedInset).toBe(12)
    expect(MINI_EXPANDED_TRANSPORT_RIGHT_INSET).toBe(expectedInset)
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
  test('the one-line row is uniform: the pill, the island and the circles share one height', () => {
    // Collapsed, the tab and search circles shrink to the mini player height, so
    // the one-line row has a single height all the way across; the pill itself
    // never grows.
    expect(TAB_BAR_ISLAND_HEIGHT).toBe(PLAYER_SIZES.miniPlayerHeight)
    expect(BAR_CIRCLE_SIZE).toBe(TAB_BAR_ISLAND_HEIGHT)
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

describe('wide mini player styles', () => {
  test('the wide pill is taller than the compact one', () => {
    expect(PLAYER_SIZES.wideMiniPlayerHeight).toBe(64)
    expect(wideStyles.miniContainer.height).toBe(PLAYER_SIZES.wideMiniPlayerHeight)
  })

  test('the wide artwork grows with the taller pill so it does not look sparse', () => {
    expect(MINI_WIDE_ARTWORK_SIZE).toBe(48)
    expect(wideStyles.miniCover.width).toBe(MINI_WIDE_ARTWORK_SIZE)
    expect(wideStyles.miniCover.height).toBe(MINI_WIDE_ARTWORK_SIZE)
    expect(wideStyles.miniCover.width).toBeGreaterThan(MINI_ARTWORK_SIZE)
  })

  test('repeat and favorite share one glyph/box pair, a touch under the old heart', () => {
    expect(MINI_WIDE_ACTION_ICON_SIZE).toBe(18)
    expect(MINI_WIDE_ACTION_BOX_SIZE).toBe(36)
    // The smaller visual box must still expose the full 48dp touch target.
    expect(MINI_WIDE_ACTION_BOX_SIZE + MINI_WIDE_ACTION_HIT_SLOP * 2).toBeGreaterThanOrEqual(
      MIN_TOUCH_TARGET,
    )
    expect(wideToolbarStyles.actionButton.width).toBe(MINI_WIDE_ACTION_BOX_SIZE)
    expect(wideToolbarStyles.actionButton.height).toBe(MINI_WIDE_ACTION_BOX_SIZE)
  })

  test('one gap constant drives the transport cluster and the heart-to-artwork seam', () => {
    expect(MINI_WIDE_CONTROL_GAP).toBe(6)
    expect(wideToolbarStyles.transportCluster.gap).toBe(MINI_WIDE_CONTROL_GAP)
    // The row's own gap is the seam between the transport cluster (ending on the
    // heart) and the track-info block (starting with the artwork).
    expect(wideToolbarStyles.controlsRow.gap).toBe(MINI_WIDE_CONTROL_GAP)
    expect(wideToolbarStyles.rightCluster.gap).toBe(MINI_WIDE_CONTROL_GAP)
  })

  test('the heart-to-artwork seam keeps the same air as the transport seams', () => {
    // Transport seams sit between 48dp touch boxes that centre their glyphs, so
    // both sides contribute glyph air; the artwork is flush with its own box, so
    // the heart→artwork seam would lose the next-track glyph's inset and read
    // narrower. The track-info leading inset restores that air.
    const heartRightInset = (MINI_WIDE_ACTION_BOX_SIZE - MINI_WIDE_ACTION_ICON_SIZE) / 2
    const nextGlyphInset = (MIN_TOUCH_TARGET - WIDE_SKIP_GLYPH_SIZE) / 2
    const heartNextGap = heartRightInset + wideToolbarStyles.transportCluster.gap + nextGlyphInset
    const heartArtworkGap =
      heartRightInset +
      wideToolbarStyles.controlsRow.gap +
      getTrackInfoLeadingInset(wideToolbarStyles)

    expect(getTrackInfoLeadingInset(wideToolbarStyles)).toBe(nextGlyphInset)
    expect(heartArtworkGap).toBe(heartNextGap)
  })
})
