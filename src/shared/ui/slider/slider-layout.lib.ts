import { SCREEN_WIDTH } from '../../config/screen-dimensions'
import { FONT_SIZES, INDENTS } from '../theme/themed'
import { SliderItemSize } from './slider-item/slider-item.types'

interface SliderCardLayout {
  cardWidth: number
  stride: number
}

// XL/L define their width as a fixed fraction of the layout basis. M/S keep the
// legacy "n full strides + two symmetric peeks" contract that defines only the
// WIDTH — positioning and snapping are shared for all sizes.
interface SliderSizeContract {
  fullStrides?: number
  peekRatio?: number
  screenRatio?: number
}

const SLIDER_GAP = INDENTS.middle

// Vertical gap between stacked sliders — one line of the section title
// (`titleFontSize` defaults to `FONT_SIZES.h2`). Deliberately independent of the
// card size so the rhythm between sections is the same for every slider.
export const SLIDER_STACK_GAP = FONT_SIZES.h2

// Fixed left peek of a cut card: 12 dp ≈ 2 mm physical on a phone.
export const SLIDER_PEEK = 12

// The left line every card rests on after snapping and where the first card
// starts. It is the peek plus the inter-card gap.
export const SLIDER_REST_INSET = SLIDER_PEEK + SLIDER_GAP

// Largest common phone min side. Cards scale with the screen up to this
// reference; on larger screens (tablets/desktop) they keep the exact
// proportions of the biggest phone instead of growing indefinitely.
const MAX_MOBILE_MIN_SIDE = 430

export const MAX_SLIDER_LAYOUT_BASIS = MAX_MOBILE_MIN_SIDE

// A viewport measured before layout settles can be narrower than the gaps,
// which would drive the width formula negative; a floor keeps the card
// tappable instead of collapsing it.
const MIN_CARD_WIDTH = 48

const SNAP_EPSILON = 0.5

const SLIDER_SIZE_CONTRACT: Record<SliderItemSize, SliderSizeContract> = {
  [SliderItemSize.Large]: { screenRatio: 0.5 },
  [SliderItemSize.Middle]: { fullStrides: 2, peekRatio: 0.2 },
  [SliderItemSize.Small]: { fullStrides: 3, peekRatio: 0.2 },
  [SliderItemSize.XLarge]: { screenRatio: 0.77 },
}

export const getSliderCardLayout = (
  size: SliderItemSize,
  layoutBasis: number,
): SliderCardLayout => {
  const { fullStrides = 0, peekRatio = 0, screenRatio } = SLIDER_SIZE_CONTRACT[size]
  const basis = Math.min(layoutBasis, MAX_SLIDER_LAYOUT_BASIS)
  // The -2 * SLIDER_GAP for M/S reproduces exactly today's widths because the
  // old viewport excluded the consumer padding that is now removed.
  const cardWidth = Math.max(
    screenRatio !== undefined
      ? screenRatio * basis
      : (basis - 2 * SLIDER_GAP - (fullStrides + 1) * SLIDER_GAP) / (fullStrides + 2 * peekRatio),
    MIN_CARD_WIDTH,
  )

  return { cardWidth, stride: cardWidth + SLIDER_GAP }
}

export const getSliderLayoutViewport = (measuredWidth?: number): number =>
  Math.min(measuredWidth ?? SCREEN_WIDTH, MAX_SLIDER_LAYOUT_BASIS)

export const getSliderContentWidth = ({
  cardWidth,
  columnCount,
  stride,
}: {
  cardWidth: number
  columnCount: number
  stride: number
}): number => 2 * SLIDER_REST_INSET + (columnCount - 1) * stride + cardWidth

export const buildSliderSnapOffsets = ({
  columnCount,
  contentWidth,
  stride,
  viewportWidth,
}: {
  columnCount: number
  contentWidth: number
  stride: number
  viewportWidth: number
}): number[] => {
  const maxOffset = Math.max(contentWidth - viewportWidth, 0)
  if (maxOffset <= 0) return []

  // Content is padded by SLIDER_REST_INSET on both sides, so offset k * stride
  // puts card k back on the rest line (left edge at SLIDER_REST_INSET) and the
  // cut card on the left shows exactly SLIDER_PEEK. maxOffset shows the last
  // card with whatever remains.
  const offsets = [0]
  for (let columnIndex = 1; columnIndex < columnCount; columnIndex += 1) {
    const offset = columnIndex * stride
    if (offset >= maxOffset - SNAP_EPSILON) break
    offsets.push(offset)
  }
  offsets.push(maxOffset)

  return offsets
}
