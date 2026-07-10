import { screen } from '@testing-library/react-native'
import '@testing-library/jest-native/extend-expect'
import { renderWithProviders } from '../../mocks/renderWithProviders'
import { MarqueeText } from './marquee-text'

const TEST_ID = 'marquee-text'

const propsStub = {
  testID: TEST_ID,
  text: 'Hello World',
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
})
