import { fireEvent, screen } from '@testing-library/react-native'
import { Platform, StyleSheet } from 'react-native'
import { withTiming } from 'react-native-reanimated'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { MarqueeText } from './marquee-text'

const TEST_ID = 'marquee-text'

const propsStub = {
  testID: TEST_ID,
  text: 'Hello World',
}

const fireContainerLayout = async (width: number) => {
  await fireEvent(screen.getByTestId(TEST_ID), 'layout', {
    nativeEvent: { layout: { width } },
  })
}

const fireTextLayout = async (text: string, width: number) => {
  const texts = screen.getAllByText(text)
  // The hidden measurer is the last Text node with the same content
  await fireEvent(texts[texts.length - 1], 'textLayout', {
    nativeEvent: { lines: [{ width }] },
  })
}

const fireMeasurerLayout = async (text: string, width: number) => {
  const texts = screen.getAllByText(text)
  await fireEvent(texts[texts.length - 1], 'layout', {
    nativeEvent: { layout: { width } },
  })
}

describe('<MarqueeText />', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })
  test('returns null when text is empty', async () => {
    const { queryByTestId } = await renderWithProviders(<MarqueeText text='' />)
    expect(queryByTestId(TEST_ID)).toBeNull()
  })

  test('returns null when text is undefined', async () => {
    const { queryByTestId } = await renderWithProviders(
      // @ts-expect-error - testing undefined text
      <MarqueeText text={undefined} />,
    )
    expect(queryByTestId(TEST_ID)).toBeNull()
  })

  test('renders text content', async () => {
    await renderWithProviders(<MarqueeText text={propsStub.text} />)
    expect(screen.getAllByText(propsStub.text).length).toBeGreaterThanOrEqual(1)
  })

  test('testID is applied to container', async () => {
    await renderWithProviders(<MarqueeText text={propsStub.text} testID={propsStub.testID} />)
    expect(screen.getByTestId(propsStub.testID)).toBeTruthy()
  })

  test('renders a Text node with the title', async () => {
    await renderWithProviders(<MarqueeText text={propsStub.text} />)

    const titleTexts = screen.getAllByText(propsStub.text)
    const titleText = titleTexts[0]
    expect(titleText.type).toBe('Text')
    expect(titleText.children[0]).toBe(propsStub.text)
  })

  test('renders a single copy when the text fits the container', async () => {
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    await fireContainerLayout(300)
    await fireTextLayout(propsStub.text, 100)

    expect(screen.getAllByText(propsStub.text)).toHaveLength(2)
  })

  test('centers the static text when centerWhenStatic is set', async () => {
    await renderWithProviders(
      <MarqueeText centerWhenStatic testID={TEST_ID} text={propsStub.text} />,
    )

    await fireContainerLayout(300)
    await fireTextLayout(propsStub.text, 100)

    const animatedView = screen.getAllByText(propsStub.text)[0].parent
    const style = StyleSheet.flatten(animatedView?.props.style)
    expect(style.alignSelf).toBe('center')
  })

  test('switches from centered static to scrolling when the text overflows', async () => {
    const shortText = 'Короткий'
    const longText = 'Очень длинный текст, который не помещается в контейнер'

    const { rerender } = await renderWithProviders(
      <MarqueeText centerWhenStatic testID={TEST_ID} text={shortText} />,
    )

    await fireContainerLayout(300)
    await fireTextLayout(shortText, 100)
    expect(
      StyleSheet.flatten(screen.getAllByText(shortText)[0].parent?.props.style).alignSelf,
    ).toBe('center')

    await rerender(<MarqueeText text={longText} centerWhenStatic testID={TEST_ID} />)
    await fireContainerLayout(100)
    await fireTextLayout(longText, 300)
    expect(StyleSheet.flatten(screen.getAllByText(longText)[0].parent?.props.style).alignSelf).toBe(
      'flex-start',
    )
  })

  test('keeps the static text left-aligned by default', async () => {
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    await fireContainerLayout(300)
    await fireTextLayout(propsStub.text, 100)

    const animatedView = screen.getAllByText(propsStub.text)[0].parent
    const style = StyleSheet.flatten(animatedView?.props.style)
    expect(style.alignSelf).toBe('flex-start')
  })

  test('renders a duplicate copy when the text overflows the container', async () => {
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    await fireContainerLayout(100)
    await fireTextLayout(propsStub.text, 300)

    expect(screen.getAllByText(propsStub.text)).toHaveLength(3)
  })

  test('renders a duplicate copy for a short overflowing title (geometric eligibility)', async () => {
    // The reported bug: a title with few characters but wide glyphs overflows
    // geometrically (maxOffset > 0) yet never marqueed because its character
    // length was below the old animation threshold. Eligibility is now purely
    // geometric — overflow alone arms the duplicate copy, regardless of length.
    const shortWideText = 'Короткий'

    await renderWithProviders(<MarqueeText testID={TEST_ID} text={shortWideText} />)

    await fireContainerLayout(100)
    await fireTextLayout(shortWideText, 300)

    expect(screen.getAllByText(shortWideText)).toHaveLength(3)
  })

  test('keeps the title static before any drag', async () => {
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    await fireContainerLayout(100)
    await fireTextLayout(propsStub.text, 300)

    const animatedView = screen.getAllByText(propsStub.text)[0].parent
    const style = StyleSheet.flatten(animatedView?.props.style)
    expect(style.transform).toEqual([{ translateX: 0 }])
    expect(withTiming).not.toHaveBeenCalled()
  })

  test('re-evaluates the need for a duplicate when the text changes', async () => {
    const shortText = 'Short'
    const longText = 'A much longer text that overflows the container'

    const { rerender } = await renderWithProviders(
      <MarqueeText text={shortText} testID={TEST_ID} />,
    )

    await fireContainerLayout(300)
    await fireTextLayout(shortText, 100)
    expect(screen.getAllByText(shortText)).toHaveLength(2)

    await rerender(<MarqueeText text={longText} testID={TEST_ID} />)

    // The reanimated mock recreates shared values on re-render, so the
    // container measurement must be re-established before the new text is measured
    await fireContainerLayout(300)
    await fireTextLayout(longText, 400)
    expect(screen.getAllByText(longText)).toHaveLength(3)
  })

  test('re-evaluates the need for a duplicate when the container resizes', async () => {
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    await fireContainerLayout(100)
    await fireTextLayout(propsStub.text, 300)
    expect(screen.getAllByText(propsStub.text)).toHaveLength(3)

    await fireContainerLayout(400)
    await fireTextLayout(propsStub.text, 300)
    expect(screen.getAllByText(propsStub.text)).toHaveLength(2)
  })

  test('measures text width via onLayout on web', async () => {
    jest.replaceProperty(Platform, 'OS', 'web')
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    await fireContainerLayout(100)
    await fireMeasurerLayout(propsStub.text, 300)

    expect(screen.getAllByText(propsStub.text)).toHaveLength(3)
  })

  test('uses max-content width for the web measurer', async () => {
    // Regression: an absolutely positioned element's shrink-to-fit width clamps
    // to the container, so the measurer reported ~containerWidth and overflowing
    // titles never became marquee-eligible. width: 'max-content' makes the
    // measurer report the full text width.
    jest.replaceProperty(Platform, 'OS', 'web')
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    const texts = screen.getAllByText(propsStub.text)
    const measurer = texts[texts.length - 1]
    const style = StyleSheet.flatten(measurer.props.style)
    expect(style.width).toBe('max-content')
    expect(style.whiteSpace).toBe('nowrap')
  })

  test('keeps the full container width for centered static text on web', async () => {
    // The default static path reuses the marquee geometry (2*textWidth +
    // REPEAT_SPACER) on every platform; only centerWhenStatic keeps the web
    // static row at '100%' (staticWidth) so the centered text spans the
    // container.
    jest.replaceProperty(Platform, 'OS', 'web')
    await renderWithProviders(
      <MarqueeText centerWhenStatic testID={TEST_ID} text={propsStub.text} />,
    )

    const animatedView = screen.getAllByText(propsStub.text)[0].parent
    const style = StyleSheet.flatten(animatedView?.props.style)
    expect(style.width).toBe('100%')
  })

  test('centers static text on web when centerWhenStatic is set', async () => {
    jest.replaceProperty(Platform, 'OS', 'web')
    await renderWithProviders(
      <MarqueeText centerWhenStatic testID={TEST_ID} text={propsStub.text} />,
    )

    const animatedView = screen.getAllByText(propsStub.text)[0].parent
    const style = StyleSheet.flatten(animatedView?.props.style)
    expect(style.justifyContent).toBe('center')
  })

  test('visible copies never ellipsize on web (no line-clamp, nowrap, clip)', async () => {
    // The reported bug: RNW maps numberOfLines={1} to textOverflow: 'ellipsis',
    // so a scrolling copy whose allocated width is a hair smaller than the
    // rendered text shows "…". On web the copies must drop numberOfLines
    // entirely — whiteSpace: 'nowrap' forces the single line, the container's
    // overflow: 'hidden' does the clipping.
    jest.replaceProperty(Platform, 'OS', 'web')
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    const visible = screen.getAllByText(propsStub.text)[0]
    expect(visible.props.numberOfLines).toBeUndefined()
    expect(visible.props.ellipsizeMode).toBe('clip')
    expect(StyleSheet.flatten(visible.props.style).whiteSpace).toBe('nowrap')
  })

  test('marquee copies never ellipsize on web', async () => {
    jest.replaceProperty(Platform, 'OS', 'web')
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    await fireContainerLayout(100)
    await fireMeasurerLayout(propsStub.text, 300)

    const texts = screen.getAllByText(propsStub.text)
    expect(texts).toHaveLength(3)
    for (const copy of texts.slice(0, 2)) {
      expect(copy.props.numberOfLines).toBeUndefined()
      expect(copy.props.ellipsizeMode).toBe('clip')
      expect(StyleSheet.flatten(copy.props.style).whiteSpace).toBe('nowrap')
    }
  })

  test('visible copies clip without ellipsis on native', async () => {
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    const visible = screen.getAllByText(propsStub.text)[0]
    expect(visible.props.numberOfLines).toBe(1)
    expect(visible.props.ellipsizeMode).toBe('clip')
  })

  test('stops the loop and returns to static when the container grows to fit', async () => {
    // The reported bug: a fitting title scrolled because needsMarquee stayed
    // true while maxOffset dropped to ~0 (transient layout / sub-pixel). When
    // the container grows past the text, the duplicate copy must disappear and
    // the static branch (centered) must be restored.
    await renderWithProviders(
      <MarqueeText centerWhenStatic testID={TEST_ID} text={propsStub.text} />,
    )

    await fireContainerLayout(200)
    await fireTextLayout(propsStub.text, 250)
    expect(screen.getAllByText(propsStub.text)).toHaveLength(3)
    expect(
      StyleSheet.flatten(screen.getAllByText(propsStub.text)[0].parent?.props.style).alignSelf,
    ).toBe('flex-start')

    await fireContainerLayout(260)
    expect(screen.getAllByText(propsStub.text)).toHaveLength(2)
    expect(
      StyleSheet.flatten(screen.getAllByText(propsStub.text)[0].parent?.props.style).alignSelf,
    ).toBe('center')
  })
})
