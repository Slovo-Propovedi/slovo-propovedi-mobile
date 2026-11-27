import { INDENTS } from '../theme/themed'
import { SliderItemSize } from './slider-item/slider-item.types'
import {
  buildSliderSnapOffsets,
  getSliderCardLayout,
  getSliderContentWidth,
  getSliderLayoutViewport,
  MAX_SLIDER_LAYOUT_BASIS,
  SLIDER_PEEK,
  SLIDER_REST_INSET,
} from './slider-layout.lib'

const BASE_WIDTH = 390
const DEFAULT_VIEWPORT = BASE_WIDTH

describe('getSliderCardLayout', () => {
  test('caps the layout basis passed by the owner', () => {
    expect(getSliderLayoutViewport(BASE_WIDTH)).toBe(DEFAULT_VIEWPORT)
  })

  test('clamps the base to a narrower embedded list', () => {
    expect(getSliderLayoutViewport(BASE_WIDTH, 300)).toBe(300)
    expect(getSliderLayoutViewport(BASE_WIDTH, 844)).toBe(DEFAULT_VIEWPORT)
  })

  test.each([
    [SliderItemSize.Small, 93.52941176470588, 105.52941176470588],
    [SliderItemSize.Middle, 137.5, 149.5],
    [SliderItemSize.Large, 195, 207],
    [SliderItemSize.XLarge, 300.3, 312.3],
  ])('%s card keeps the geometry at the default basis', (size, width, stride) => {
    const layout = getSliderCardLayout(size, DEFAULT_VIEWPORT)

    expect(layout.cardWidth).toBeCloseTo(width, 5)
    expect(layout.stride).toBeCloseTo(stride, 5)
  })

  test('caps the layout basis at the biggest-phone reference', () => {
    expect(getSliderLayoutViewport(1000)).toBe(MAX_SLIDER_LAYOUT_BASIS)
    expect(getSliderCardLayout(SliderItemSize.Small, 1000)).toEqual(
      getSliderCardLayout(SliderItemSize.Small, MAX_SLIDER_LAYOUT_BASIS),
    )
  })

  test('floors the card width on a degenerate basis', () => {
    expect(getSliderCardLayout(SliderItemSize.Small, 40).cardWidth).toBe(48)
  })
})

describe('buildSliderSnapOffsets', () => {
  const layout = getSliderCardLayout(SliderItemSize.Small, DEFAULT_VIEWPORT)

  test('lands every column on the shared rest line for a ten-column row', () => {
    const columnCount = 10
    const contentWidth = getSliderContentWidth({
      cardWidth: layout.cardWidth,
      columnCount,
      stride: layout.stride,
    })
    const offsets = buildSliderSnapOffsets({
      columnCount,
      contentWidth,
      stride: layout.stride,
      viewportWidth: DEFAULT_VIEWPORT,
    })

    expect(offsets[0]).toBe(0)
    expect(offsets.at(-1)).toBeCloseTo(contentWidth - DEFAULT_VIEWPORT, 5)
    offsets.slice(1, -1).forEach((offset, index) => {
      expect(offset).toBeCloseTo((index + 1) * layout.stride, 5)
    })
    const isStrictlyIncreasing = offsets.every(
      (offset, index) => index === 0 || offset > offsets[index - 1],
    )
    expect(isStrictlyIncreasing).toBe(true)
  })

  test('returns no offsets when the content fits the viewport', () => {
    const contentWidth = getSliderContentWidth({
      cardWidth: layout.cardWidth,
      columnCount: 1,
      stride: layout.stride,
    })

    expect(
      buildSliderSnapOffsets({
        columnCount: 1,
        contentWidth,
        stride: layout.stride,
        viewportWidth: DEFAULT_VIEWPORT,
      }),
    ).toEqual([])
    expect(
      buildSliderSnapOffsets({
        columnCount: 1,
        contentWidth,
        stride: layout.stride,
        viewportWidth: 10_000,
      }),
    ).toEqual([])
  })

  test('keeps a fixed left peek regardless of the card size', () => {
    expect(SLIDER_PEEK).toBe(12)
    expect(SLIDER_REST_INSET - INDENTS.middle).toBe(SLIDER_PEEK)
  })

  test.each([
    SliderItemSize.Small,
    SliderItemSize.Middle,
    SliderItemSize.Large,
    SliderItemSize.XLarge,
  ])('%s offsets keep every column on the rest line at any width', size => {
    const widths = [320, 360, 390, 412, 430]
    const columnCount = 7

    widths.forEach(viewportWidth => {
      const sizeLayout = getSliderCardLayout(size, viewportWidth)
      const contentWidth = getSliderContentWidth({
        cardWidth: sizeLayout.cardWidth,
        columnCount,
        stride: sizeLayout.stride,
      })
      const offsets = buildSliderSnapOffsets({
        columnCount,
        contentWidth,
        stride: sizeLayout.stride,
        viewportWidth,
      })

      expect(offsets[0]).toBe(0)
      expect(offsets.at(-1)).toBeCloseTo(contentWidth - viewportWidth, 5)
      expect(SLIDER_REST_INSET - INDENTS.middle).toBe(SLIDER_PEEK)
      expect(SLIDER_PEEK).toBe(12)

      offsets.slice(1, -1).forEach(offset => {
        // Floating-point sums can land a hair below the next stride, so the
        // remainder is normalised against the stride instead of compared to 0.
        const remainder = offset % sizeLayout.stride

        expect(Math.min(remainder, sizeLayout.stride - remainder)).toBeCloseTo(0, 5)
      })
    })
  })
})
