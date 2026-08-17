import { fireEvent, screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
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

describe('<MarqueeText />', () => {
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

  test('renders a duplicate copy when the text overflows the container', async () => {
    await renderWithProviders(<MarqueeText testID={TEST_ID} text={propsStub.text} />)

    await fireContainerLayout(100)
    await fireTextLayout(propsStub.text, 300)

    expect(screen.getAllByText(propsStub.text)).toHaveLength(3)
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
})
